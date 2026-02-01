from django.db import models
from django.conf import settings
import uuid
from apps.question_bank.models import Question

class Exam(models.Model):
    STATUS_CHOICES = [('DRAFT', 'Draft'), ('PUBLISHED', 'Published')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_minutes = models.IntegerField(default=60)
    pass_marks = models.IntegerField(default=40)
    negative_marking = models.FloatField(default=0.0) # Penalty per wrong answer
    partial_scoring = models.BooleanField(default=False) # For MCQs with multiple correct
    shuffle_questions = models.BooleanField(default=False)
    is_adaptive = models.BooleanField(default=False)
    is_offline_capable = models.BooleanField(default=False)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    questions = models.ManyToManyField(Question, through='ExamQuestion', related_name='exams')
    
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_exams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ex_exams'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ExamQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    marks = models.IntegerField(default=1)
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'ex_exam_questions'
        ordering = ['order']
        unique_together = ('exam', 'question')

    def __str__(self):
        return f"{self.exam.title} - {self.question.title}"
