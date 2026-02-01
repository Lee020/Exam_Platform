from django.db import models
from django.conf import settings
import uuid
from django.utils import timezone
from apps.exams.models import Exam
from apps.question_bank.models import Question, Choice

class Attempt(models.Model):
    STATUS_CHOICES = [
        ('STARTED', 'Started'),
        ('COMPLETED', 'Completed'),
        ('TIMEOUT', 'Timeout')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attempts')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    start_time = models.DateTimeField(auto_now_add=True)
    finish_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='STARTED')
    score = models.FloatField(default=0.0)
    
    # Security tracking
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.TextField(null=True, blank=True)
    violation_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'att_attempts'
        ordering = ['-start_time']

    def __str__(self):
        return f"{self.user.username} - {self.exam.title} ({self.status})"
    
    @property
    def is_active(self):
        if self.status != 'STARTED':
            return False
        if not self.start_time:
            return True # Just created
        # Calculate if time is up
        limit = self.exam.duration_minutes
        elapsed = (timezone.now() - self.start_time).total_seconds() / 60
        return elapsed < limit


class StudentAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attempt = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.SET_NULL, null=True, blank=True)
    answer_text = models.TextField(null=True, blank=True) # For descriptive answers
    feedback = models.TextField(null=True, blank=True) # AI or Instructor feedback
    is_correct = models.BooleanField(default=False)
    marks_awarded = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'att_student_answers'
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Ans: {self.question.title} by {self.attempt.user.username}"
