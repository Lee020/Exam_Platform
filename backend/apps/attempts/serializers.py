from rest_framework import serializers
from .models import Attempt, StudentAnswer
from apps.exams.models import Exam, ExamQuestion
from apps.question_bank.models import Question, Choice
from apps.users.serializers import UserSerializer
from django.utils import timezone
import random

class StudentChoiceSerializer(serializers.ModelSerializer):
    """Serializer for choices that hides is_correct field"""
    class Meta:
        model = Choice
        fields = ['id', 'text']

class StudentQuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions during an attempt"""
    choices = StudentChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'title', 'question_text', 'question_type', 'choices']

class AttemptSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    questions = serializers.SerializerMethodField()
    seconds_remaining = serializers.SerializerMethodField()
    
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Attempt
        fields = [
            'id', 'exam', 'exam_title', 'start_time', 'finish_time', 
            'status', 'score', 'questions', 'is_active', 'seconds_remaining',
            'violation_count', 'user_details'
        ]
        read_only_fields = ['id', 'start_time', 'finish_time', 'status', 'score', 'questions', 'violation_count']

    def get_seconds_remaining(self, obj):
        if obj.status != 'STARTED':
            return 0
        limit_seconds = obj.exam.duration_minutes * 60
        if not obj.start_time:
            return limit_seconds
        elapsed_seconds = (timezone.now() - obj.start_time).total_seconds()
        remaining = int(limit_seconds - elapsed_seconds)
        return max(0, remaining)

    def get_questions(self, obj):
        # Return questions linked to the exam
        # Ideally, we should order them as per ExamQuestion order
        exam_questions = ExamQuestion.objects.filter(exam=obj.exam).select_related('question').order_by('order')
        questions = [eq.question for eq in exam_questions]
        
        if obj.exam.shuffle_questions:
            random.shuffle(questions)
            
        return StudentQuestionSerializer(questions, many=True).data

class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.UUIDField()
    selected_choice_id = serializers.UUIDField(required=False, allow_null=True)
    answer_text = serializers.CharField(required=False, allow_blank=True, allow_null=True)

# --- REVIEW SERIALIZERS ---
class ReviewChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']

class ReviewQuestionSerializer(serializers.ModelSerializer):
    choices = ReviewChoiceSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ['id', 'title', 'question_text', 'question_type', 'choices']

class StudentAnswerReviewSerializer(serializers.ModelSerializer):
    question = ReviewQuestionSerializer(read_only=True)
    selected_choice_id = serializers.UUIDField(source='selected_choice.id', read_only=True)
    
    class Meta:
        model = StudentAnswer
        fields = ['question', 'selected_choice_id', 'answer_text', 'feedback', 'is_correct', 'marks_awarded']

class AttemptReviewSerializer(serializers.ModelSerializer):
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    answers = StudentAnswerReviewSerializer(many=True, read_only=True)
    
    class Meta:
        model = Attempt
        fields = [
            'id', 'exam', 'exam_title', 'start_time', 'finish_time', 
            'status', 'score', 'answers', 'violation_count'
        ]
