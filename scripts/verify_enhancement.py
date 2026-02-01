import os
import django
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.exams.views import ExamQuestionViewSet
from apps.exams.models import ExamQuestion, Exam
from apps.question_bank.models import Question
from apps.users.models import User

def run_verification():
    print("Verifying Enhancements...")
    
    # 1. Setup User and Data
    user = User.objects.filter(username="verify_instructor").first()
    if not user:
        print("Instructor not found")
        return

    exam = Exam.objects.filter(title="Midterm Math Exam").first()
    if not exam:
        print("Exam not found")
        return
        
    eq = ExamQuestion.objects.filter(exam=exam).first()
    if not eq:
        print("ExamQuestion not found")
        return
        
    print(f"Original Marks: {eq.marks}, Order: {eq.order}")
    
    # 2. Simulate PATCH Request to update marks
    factory = APIRequestFactory()
    view = ExamQuestionViewSet.as_view({'patch': 'partial_update'})
    
    new_marks = 10
    new_order = 5
    
    request = factory.patch(f'/api/exam-questions/{eq.id}/', {'marks': new_marks, 'order': new_order})
    force_authenticate(request, user=user)
    
    response = view(request, pk=eq.id)
    
    if response.status_code == 200:
        print("Update Successful")
        eq.refresh_from_db()
        print(f"New Marks: {eq.marks}, Order: {eq.order}")
        if eq.marks == new_marks and eq.order == new_order:
            print("VERIFICATION SUCCESSFUL")
        else:
            print("VERIFICATION FAILED: DB not updated matches")
    else:
        print(f"Update Failed: {response.status_code} - {response.data}")

    # 3. Simulate PATCH Request to update Exam Metadata
    print("\nVerifying Exam Metadata Update...")
    from apps.exams.views import ExamViewSet
    view_exam = ExamViewSet.as_view({'patch': 'partial_update'})
    
    new_title = "Advanced Math Exam"
    new_duration = 120
    
    request_exam = factory.patch(f'/api/exams/{exam.id}/', {'title': new_title, 'duration_minutes': new_duration})
    force_authenticate(request_exam, user=user)
    
    response_exam = view_exam(request_exam, pk=exam.id)
    
    if response_exam.status_code == 200:
        print("Exam Update Successful")
        exam.refresh_from_db()
        print(f"New Title: {exam.title}, Duration: {exam.duration_minutes}")
        if exam.title == new_title and exam.duration_minutes == new_duration:
            print("EXAM METADATA VERIFICATION SUCCESSFUL")
        else:
            print("EXAM METADATA VERIFICATION FAILED")
    else:
        print(f"Exam Update Failed: {response_exam.status_code} - {response_exam.data}")

run_verification()
