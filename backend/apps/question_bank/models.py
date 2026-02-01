from django.db import models
from django.utils import timezone
from django.conf import settings
import uuid


class Subject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'qb_subjects'

    def __str__(self):
        return self.name


class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='topics')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'qb_topics'
        unique_together = ('name', 'subject')

    def __str__(self):
        return f"{self.subject.name} - {self.name}"


class Question(models.Model):
    TYPE_CHOICES = [('MCQ', 'Multiple Choice'), ('TF', 'True/False'), ('DESCRIPTIVE', 'Descriptive / Essay')]
    DIFFICULTY_CHOICES = [('EASY', 'Easy'), ('MEDIUM', 'Medium'), ('HARD', 'Hard')]
    STATUS_CHOICES = [('DRAFT', 'Draft'), ('PUBLISHED', 'Published')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='EASY')
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name='questions')
    topic = models.ForeignKey(Topic, on_delete=models.PROTECT, related_name='questions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    version = models.IntegerField(default=1)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'qb_questions'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (v{self.version})"


class Choice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=1000)
    is_correct = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'qb_choices'

    def __str__(self):
        return f"Choice({self.text[:50]}) for {self.question_id}"
