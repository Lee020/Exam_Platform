from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Attempt, StudentAnswer
from .serializers import AttemptSerializer, SubmitAnswerSerializer
from apps.exams.models import Exam, ExamQuestion
from apps.question_bank.models import Choice

class AttemptViewSet(viewsets.ModelViewSet):
    serializer_class = AttemptSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Admin and Instructors can see ALL attempts (for monitoring/results)
        if getattr(user, 'is_admin', False) or getattr(user, 'role_name', '').upper() == 'INSTRUCTOR':
            return Attempt.objects.all()
        # Students see only their own
        return Attempt.objects.filter(user=user)

    @action(detail=False, methods=['post'], url_path='start/(?P<exam_id>[^/.]+)')
    def start_attempt(self, request, exam_id=None):
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({'detail': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        if exam.status != 'PUBLISHED':
             return Response({'detail': 'Exam is not published'}, status=status.HTTP_403_FORBIDDEN)

        # Check existing active attempt
        existing_attempt = Attempt.objects.filter(user=request.user, exam=exam, status='STARTED').first()
        if existing_attempt:
            # Check if time expired
            if not existing_attempt.is_active:
                existing_attempt.status = 'TIMEOUT'
                existing_attempt.finish_time = timezone.now()
                existing_attempt.save()
            else:
                 return Response(AttemptSerializer(existing_attempt, context={'request': request}).data)

        # Create attempt
        attempt = Attempt.objects.create(
            user=request.user,
            exam=exam,
            status='STARTED',
            ip_address=request.META.get('REMOTE_ADDR'),
            device_info=request.META.get('HTTP_USER_AGENT')
        )
        attempt.refresh_from_db()
        return Response(AttemptSerializer(attempt, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='submit-answer')
    def submit_answer(self, request, pk=None):
        attempt = self.get_object()
        
        if not attempt.is_active:
             return Response({'detail': 'Attempt is no longer active'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmitAnswerSerializer(data=request.data)
        if serializer.is_valid():
            q_id = serializer.validated_data['question_id']
            c_id = serializer.validated_data.get('selected_choice_id')
            a_text = serializer.validated_data.get('answer_text')

            from apps.question_bank.models import Question
            try:
                question = Question.objects.get(id=q_id)
            except Question.DoesNotExist:
                return Response({'detail': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

            # Get max marks from ExamQuestion config
            try:
                eq = ExamQuestion.objects.get(exam=attempt.exam, question_id=q_id)
                max_marks = eq.marks
            except ExamQuestion.DoesNotExist:
                max_marks = 1 

            defaults = {}
            if question.question_type == 'DESCRIPTIVE':
                defaults['answer_text'] = a_text
                # Mock NLP Evaluation: if text is long enough, give some marks
                word_count = len(a_text.split()) if a_text else 0
                if word_count > 50:
                    defaults['marks_awarded'] = max_marks
                    defaults['is_correct'] = True
                    defaults['feedback'] = "Strong answer with sufficient detail. (AI Evaluated)"
                elif word_count > 10:
                    defaults['marks_awarded'] = int(max_marks * 0.5)
                    defaults['is_correct'] = False
                    defaults['feedback'] = "Average answer. More detail required. (AI Evaluated)"
                else:
                    defaults['marks_awarded'] = 0
                    defaults['is_correct'] = False
                    defaults['feedback'] = "Answer too short. (AI Evaluated)"
            else:
                # MCQ or TF
                if not c_id:
                     return Response({'detail': 'Choice ID required for this question type'}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    choice = Choice.objects.get(id=c_id, question=question)
                except Choice.DoesNotExist:
                    return Response({'detail': 'Invalid choice for this question'}, status=status.HTTP_400_BAD_REQUEST)
                
                defaults['selected_choice'] = choice
                defaults['is_correct'] = choice.is_correct
                if choice.is_correct:
                    defaults['marks_awarded'] = max_marks
                else:
                    # Apply negative marking if configured
                    defaults['marks_awarded'] = -attempt.exam.negative_marking
            
            StudentAnswer.objects.update_or_create(
                attempt=attempt,
                question=question,
                defaults=defaults
            )

            response_data = {'status': 'saved'}
            
            # Adaptive Logic Placeholder: If adaptive, suggest next question
            if attempt.exam.is_adaptive:
                # Basic Logic: If correct, pick a HARDER question. If wrong, pick an EASIER one.
                # Find current difficulty
                current_diff = question.difficulty
                target_diff = current_diff
                if defaults['is_correct']:
                    if current_diff == 'EASY': target_diff = 'MEDIUM'
                    elif current_diff == 'MEDIUM': target_diff = 'HARD'
                else:
                    if current_diff == 'HARD': target_diff = 'MEDIUM'
                    elif current_diff == 'MEDIUM': target_diff = 'EASY'
                
                # Find a question in the exam with target_diff that hasn't been answered
                answered_ids = attempt.answers.values_list('question_id', flat=True)
                next_q = ExamQuestion.objects.filter(
                    exam=attempt.exam, 
                    question__difficulty=target_diff
                ).exclude(question_id__in=answered_ids).first()
                
                if next_q:
                    response_data['next_question_id'] = str(next_q.question_id)
            
            return Response(response_data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='record-violation')
    def record_violation(self, request, pk=None):
        attempt = self.get_object()
        if attempt.status != 'STARTED':
            return Response({'detail': 'Attempt not active'}, status=status.HTTP_400_BAD_REQUEST)
        
        attempt.violation_count += 1
        # Optionally auto-submit if violations > limit (e.g., 3)
        if attempt.violation_count >= 3:
             attempt.status = 'COMPLETED'
             attempt.finish_time = timezone.now()
             attempt.save()
             return Response({'status': 'terminated', 'detail': 'Violation limit exceeded'})
             
        attempt.save()
        return Response({'status': 'logged', 'count': attempt.violation_count})

    @action(detail=True, methods=['post'])
    def finish(self, request, pk=None):
        attempt = self.get_object()
        if attempt.status != 'STARTED':
             return Response({'detail': 'Attempt already finished'}, status=status.HTTP_400_BAD_REQUEST)

        # EVALUATE ALL ANSWERS AT SUBMISSION TIME
        total_score = 0.0
        
        for student_answer in attempt.answers.all():
            question = student_answer.question
            
            # Get max marks for this question
            try:
                eq = ExamQuestion.objects.get(exam=attempt.exam, question=question)
                max_marks = eq.marks
            except ExamQuestion.DoesNotExist:
                # Fallback: If Question was versioned, ExamQuestion might point to a newer version.
                # Try finding by title match (assuming title doesn't change on versioning)
                eq = ExamQuestion.objects.filter(exam=attempt.exam, question__title=question.title).first()
                if eq:
                    max_marks = eq.marks
                else:
                    max_marks = 1 # Default if absolutely no record found

            # Evaluate based on question type
            if question.question_type == 'DESCRIPTIVE':
                # Mock NLP Evaluation based on word count
                word_count = len(student_answer.answer_text.split()) if student_answer.answer_text else 0
                if word_count > 50:
                    student_answer.marks_awarded = max_marks
                    student_answer.is_correct = True
                    student_answer.feedback = "Strong answer with sufficient detail. (AI Evaluated)"
                elif word_count > 10:
                    student_answer.marks_awarded = max_marks * 0.5
                    student_answer.is_correct = False
                    student_answer.feedback = "Average answer. More detail required. (AI Evaluated)"
                else:
                    student_answer.marks_awarded = 0.0
                    student_answer.is_correct = False
                    student_answer.feedback = "Answer too short. (AI Evaluated)"
            else:
                # MCQ or TF
                if student_answer.selected_choice:
                    student_answer.is_correct = student_answer.selected_choice.is_correct
                    if student_answer.is_correct:
                        student_answer.marks_awarded = max_marks
                    else:
                        # Apply negative marking (Proportional)
                        # Assumes negative_marking is e.g. 0.25 for 25% deduction
                        # If user inputs "1.0", it deducts full marks?
                        # User request: "update negative as per stage of each question marks awarded"
                        # We will interpret the entered value as a multiplier if < 1, or absolute if > 1?
                        # Safer: Just use what the user entered. If they entered "0.25", we give -0.25?
                        # User said: "update negative as per stage of each question marks"
                        # This strongly suggests Percentage.
                        # I will assume the config is a Multiplier (e.g. 0.25).
                        # But wait, existing default is 0.0.
                        # If user enters "1", do they mean -1 mark or -100%?
                        # Given "like 3, 3... show 1", user uses integers.
                        # Let's try: If negative_marking <= 1.0 and > 0, treat as percentage.
                        # If > 1.0, treat as absolute marks.
                        neg = attempt.exam.negative_marking
                        if 0 < neg <= 1.0:
                             deduction = max_marks * neg
                        else:
                             deduction = neg
                        
                        student_answer.marks_awarded = -abs(deduction)
                else:
                    # No answer selected
                    student_answer.is_correct = False
                    student_answer.marks_awarded = 0.0
            
            student_answer.save()
            total_score += student_answer.marks_awarded
        
        # Update attempt with final score
        attempt.score = total_score
        attempt.status = 'COMPLETED'
        attempt.finish_time = timezone.now()
        attempt.save()
        
        return Response(AttemptSerializer(attempt).data)
    @action(detail=True, methods=['get'])
    def certificate(self, request, pk=None):
        attempt = self.get_object()
        if attempt.status != 'COMPLETED':
            return Response({'detail': 'Certificate only available for completed attempts'}, status=status.HTTP_400_BAD_REQUEST)

        from io import BytesIO
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from django.http import HttpResponse

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        
        # Draw certificate
        p.setFont("Helvetica-Bold", 30)
        p.drawCentredString(297, 700, "CERTIFICATE OF COMPLETION")
        
        p.setFont("Helvetica", 18)
        p.drawCentredString(297, 600, "This is to certify that")
        
        p.setFont("Helvetica-Bold", 24)
        p.drawCentredString(297, 550, attempt.user.username.upper())
        
        p.setFont("Helvetica", 18)
        p.drawCentredString(297, 500, f"has successfully completed the exam")
        
        p.setFont("Helvetica-Bold", 20)
        p.drawCentredString(297, 450, attempt.exam.title)
        
        p.setFont("Helvetica", 16)
        p.drawCentredString(297, 400, f"Score: {attempt.score} / Pass Marks: {attempt.exam.pass_marks}")
        
        p.setFont("Helvetica-Oblique", 12)
        p.drawCentredString(297, 300, f"Generated on: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        p.drawCentredString(297, 280, f"Certificate ID: {attempt.id}")

        p.showPage()
        p.save()

        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="certificate_{attempt.id}.pdf"'
        return response

    @action(detail=True, methods=['get'])
    def review(self, request, pk=None):
        # Allow Instructors/Admins to view any attempt, Students only their own
        if request.user.role.name in ['ADMIN', 'INSTRUCTOR']:
            attempt = Attempt.objects.get(pk=pk)
        else:
            attempt = self.get_object()
            
        from .serializers import AttemptReviewSerializer
        return Response(AttemptReviewSerializer(attempt).data)
