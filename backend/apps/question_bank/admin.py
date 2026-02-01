from django.contrib import admin
from .models import Subject, Topic, Question, Choice


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'created_at')


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('title', 'question_type', 'difficulty', 'status', 'version', 'created_by', 'created_at')
    inlines = [ChoiceInline]
    search_fields = ('title', 'description')
    list_filter = ('status', 'question_type', 'difficulty')
