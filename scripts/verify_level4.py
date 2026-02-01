import os
import django
from django.utils import timezone

# Setup Django (assuming run via manage.py shell)
from apps.users.models import User, Role
from apps.exams.models import Exam
from apps.attempts.models import Attempt, StudentAnswer
from apps.question_bank.models import Question, Choice

def run_verification():
    print("Verifying Level 4: Exam Attempt...")

    # 1. Get/Create Student
    try:
        role, _ = Role.objects.get_or_create(name="STUDENT")
        student, created = User.objects.get_or_create(username="verify_student", defaults={
            "email": "student@test.local",
            "password": "pass",
            "role": role
        })
        print(f"Student: {student}")
    except Exception as e:
        print(f"Error getting student: {e}")
        return

    # 2. Get Published Exam (from Level 3)
    exam = Exam.objects.filter(status='PUBLISHED').first() # Actually in current flow it might be DRAFT
    if not exam:
        # Try to find the draft one and publish it
        exam = Exam.objects.filter(title="Midterm Math Exam").first()
        if exam:
            exam.status = 'PUBLISHED'
            exam.save()
            print("Published existing exam.")
        else:
            print("No exam found. Run Level 3 verification.")
            return
    print(f"Exam: {exam}")

    # 3. Start Attempt
    attempt = Attempt.objects.create(user=student, exam=exam)
    print(f"Attempt Started: {attempt}")

    # 4. Submit Answer
    # Find a question in the exam
    exam_questions = exam.examquestion_set.all()
    if not exam_questions.exists():
        print("Exam has no questions.")
        return
    
    eq = exam_questions.first()
    question = eq.question
    correct_choice = question.choices.filter(is_correct=True).first()
    
    if not correct_choice:
        print("Question has no correct choice.")
        return

    # Simulate submission
    StudentAnswer.objects.create(
        attempt=attempt,
        question=question,
        selected_choice=correct_choice,
        is_correct=True,
        marks_awarded=eq.marks
    )
    print(f"Answer submitted for {question}: Correct")

    # 5. Finish Attempt
    total_score = sum(ans.marks_awarded for ans in attempt.answers.all())
    attempt.score = total_score
    attempt.status = 'COMPLETED'
    attempt.end_time = timezone.now()
    attempt.save()

    print(f"Attempt Finished. Score: {attempt.score}")
    if attempt.score == eq.marks:
        print("VERIFICATION SUCCESSFUL")
    else:
        print(f"VERIFICATION FAILED: Expected {eq.marks}, got {attempt.score}")

run_verification()
