from rest_framework import serializers
from .models import Exam, ExamQuestion
from apps.users.serializers import UserSerializer
from apps.question_bank.serializers import QuestionSerializer
from apps.question_bank.models import Question
from django.db import transaction

class ExamQuestionSerializer(serializers.ModelSerializer):
    question_details = QuestionSerializer(source='question', read_only=True)
    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(), source='question', write_only=True
    )

    class Meta:
        model = ExamQuestion
        fields = ['id', 'question_id', 'question_details', 'marks', 'order']


class ExamSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    exam_questions = ExamQuestionSerializer(source='examquestion_set', many=True, read_only=True)
    total_marks = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'duration_minutes', 'pass_marks',
            'negative_marking', 'partial_scoring', 'is_adaptive', 'is_offline_capable',
            'start_time', 'end_time', 'status', 'exam_questions',
            'total_marks', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_total_marks(self, obj):
        return sum(eq.marks for eq in obj.examquestion_set.all())

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        exam = Exam.objects.create(created_by=user, **validated_data)
        return exam

class ProvideQuestionToExamSerializer(serializers.Serializer):
    question_id = serializers.PrimaryKeyRelatedField(queryset=Question.objects.all())
    marks = serializers.IntegerField(default=1)
    order = serializers.IntegerField(default=0)
