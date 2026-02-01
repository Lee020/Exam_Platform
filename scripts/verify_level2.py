import os
import django
from django.conf import settings

# Setup Django (assuming run via manage.py shell or with correct env)
# If run via manage.py shell, this is handled.

from apps.users.models import User, Role
from apps.question_bank.models import Subject, Topic, Question, Choice

def run_verification():
    print("Verifying Level 2: Question Bank...")
    
    # 1. Create a user (Instructor)
    try:
        role, _ = Role.objects.get_or_create(name="INSTRUCTOR")
        user, created = User.objects.get_or_create(username="verify_instructor", defaults={
            "email": "instr@test.local",
            "password": "pass",
            "role": role
        })
        print(f"User: {user} (Created: {created})")
    except Exception as e:
        print(f"Error creating user: {e}")
        return

    # 2. Create Subject
    try:
        subject, created = Subject.objects.get_or_create(name="Mathematics")
        print(f"Subject: {subject} (Created: {created})")
    except Exception as e:
        print(f"Error creating subject: {e}")
        return

    # 3. Create Topic
    try:
        topic, created = Topic.objects.get_or_create(name="Algebra", subject=subject)
        print(f"Topic: {topic} (Created: {created})")
    except Exception as e:
        print(f"Error creating topic: {e}")
        return

    # 4. Create Question (MCQ)
    try:
        question = Question.objects.create(
            title="Solve 2x = 4",
            question_text="What is the value of x?",
            question_type="MCQ",
            difficulty="EASY",
            subject=subject,
            topic=topic,
            created_by=user,
            status="PUBLISHED"
        )
        print(f"Question created: {question}")
    except Exception as e:
        print(f"Error creating question: {e}")
        return

    # 5. Create Choices
    try:
        Choice.objects.create(question=question, text="2", is_correct=True)
        Choice.objects.create(question=question, text="4", is_correct=False)
        print(f"Choices created for {question}")
    except Exception as e:
        print(f"Error creating choices: {e}")
        return
        
    print("VERIFICATION SUCCESSFUL")

run_verification()
