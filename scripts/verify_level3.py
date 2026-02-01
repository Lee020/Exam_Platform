import os
import django
from django.utils import timezone
from datetime import timedelta

# Setup Django (assuming run via manage.py shell)
from apps.users.models import User
from apps.question_bank.models import Question
from apps.exams.models import Exam, ExamQuestion

def run_verification():
    print("Verifying Level 3: Exam Creation...")

    # 1. Get Instructor
    try:
        user = User.objects.get(username="verify_instructor")
        print(f"Instructor found: {user}")
    except User.DoesNotExist:
        print("Instructor not found. Running Level 2 verification first might be needed.")
        return

    # 2. Get a Question
    question = Question.objects.first()
    if not question:
        print("No questions found. Need to query Level 2 data.")
        return
    print(f"Question found: {question}")

    # 3. Create Exam
    try:
        exam = Exam.objects.create(
            title="Midterm Math Exam",
            description="Algebra and Geometry",
            duration_minutes=60,
            pass_marks=40,
            start_time=timezone.now(),
            end_time=timezone.now() + timedelta(hours=24),
            created_by=user,
            status='DRAFT'
        )
        print(f"Exam created: {exam}")
    except Exception as e:
        print(f"Error creating exam: {e}")
        return

    # 4. Add Question to Exam
    try:
        eq = ExamQuestion.objects.create(exam=exam, question=question, marks=5, order=1)
        print(f"Question added to Exam: {eq}")
    except Exception as e:
        print(f"Error linking question to exam: {e}")
        return

    # 5. Verify Link
    if exam.questions.count() > 0:
        print(f"Verification Successful: Exam has {exam.questions.count()} question(s).")
    else:
        print("Verification Failed: Exam has no questions.")

run_verification()
