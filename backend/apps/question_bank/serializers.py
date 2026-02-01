from rest_framework import serializers
from .models import Subject, Topic, Question, Choice
from apps.users.serializers import UserSerializer
from django.db import transaction


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TopicSerializer(serializers.ModelSerializer):
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())

    class Meta:
        model = Topic
        fields = ['id', 'name', 'subject', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChoiceSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)

    class Meta:
        model = Choice
        fields = ['id', 'text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)
    created_by = UserSerializer(read_only=True)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    topic = serializers.PrimaryKeyRelatedField(queryset=Topic.objects.all())

    class Meta:
        model = Question
        fields = ['id', 'title', 'question_text', 'question_type', 'difficulty', 'subject', 'topic', 'status', 'version', 'choices', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'version', 'created_by', 'created_at', 'updated_at']

    def validate(self, data):
        qtype = data.get('question_type') or getattr(self.instance, 'question_type', None)
        choices = data.get('choices', [])

        if qtype == 'MCQ':
            if len(choices) < 2:
                raise serializers.ValidationError({'choices': 'MCQ must have at least 2 choices'})
            correct = sum(1 for c in choices if c.get('is_correct'))
            if correct != 1:
                raise serializers.ValidationError({'choices': 'MCQ must have exactly 1 correct answer'})
        elif qtype == 'TF':
            if len(choices) != 2:
                raise serializers.ValidationError({'choices': 'True/False must have exactly 2 choices'})
            correct = sum(1 for c in choices if c.get('is_correct'))
            if correct != 1:
                raise serializers.ValidationError({'choices': 'True/False must have exactly 1 correct answer'})

        # prevent publishing if validation fails
        if data.get('status') == 'PUBLISHED':
            # run the same validation to ensure publishable
            pass

        return data

    @transaction.atomic
    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        user = self.context['request'].user
        # create question (version 1)
        q = Question.objects.create(created_by=user, **validated_data)
        for ch in choices_data:
            Choice.objects.create(question=q, **ch)
        return q

    @transaction.atomic
    def update(self, instance, validated_data):
        # If editing a published question, create a new version
        choices_data = validated_data.pop('choices', None)
        user = self.context['request'].user

        if instance.status == 'PUBLISHED':
            # create new question with incremented version
            new_version = instance.version + 1
            # copy fields from instance unless provided in validated_data
            data = {
                'title': validated_data.get('title', instance.title),
                'question_text': validated_data.get('question_text', instance.question_text),
                'question_type': validated_data.get('question_type', instance.question_type),
                'difficulty': validated_data.get('difficulty', instance.difficulty),
                'subject': validated_data.get('subject', instance.subject),
                'topic': validated_data.get('topic', instance.topic),
                'status': validated_data.get('status', instance.status),
                'version': new_version,
            }
            new_q = Question.objects.create(created_by=user, **data)
            # if choices provided, use them, else copy from old
            if choices_data is not None:
                for ch in choices_data:
                    ch.pop('id', None) # CRITICAL: Remove ID to prevent PK duplication on new version
                    Choice.objects.create(question=new_q, **ch)
            else:
                for old_ch in instance.choices.all():
                    Choice.objects.create(question=new_q, text=old_ch.text, is_correct=old_ch.is_correct)
            
            # [FIX]: Propagate update to Exams
            self._propagate_version_update(instance, new_q)
            
            return new_q

        # If draft, update in place
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if choices_data is not None:
            # replace choices
            instance.choices.all().delete()
            for ch in choices_data:
                ch.pop('id', None) # Ensure fresh IDs
                Choice.objects.create(question=instance, **ch)
        
        # [FIX]: If we updated in place (Draft), no need to update ExamQuestion as ID is same.
        return instance

    def _propagate_version_update(self, old_question, new_question):
        # Helper to update ExamQuestions pointing to old_question
        from apps.exams.models import ExamQuestion
        # Only update for exams that haven't started? 
        # For now, update ALL to ensure correctness for future/active users.
        # Historic attempts reference the Question ID directly, so they are safe (they point to old_question).
        # Grading Logic has been updated to handle the mismatch.
        
        ExamQuestion.objects.filter(question=old_question).update(question=new_question)

