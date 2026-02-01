from django.contrib import admin
from .models import Exam, ExamQuestion


class ExamQuestionInline(admin.TabularInline):
    model = ExamQuestion
    extra = 1
    fk_name = 'exam'
    fields = ('question', 'marks', 'order')
    # Use autocomplete instead of raw_id for better UX (Searchable Dropdown)
    autocomplete_fields = ['question']


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'duration_minutes', 'created_by', 'created_at')
    list_filter = ('status', 'created_by')
    search_fields = ('title', 'description')
    inlines = [ExamQuestionInline]
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'duration_minutes', 'pass_marks', 'negative_marking')
        }),
        ('Options', {
            'fields': ('status', 'partial_scoring', 'shuffle_questions', 'is_adaptive', 'is_offline_capable')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time')
        }),
    )
    readonly_fields = ('created_by',)

    def save_model(self, request, obj, form, change):
        # Auto-set created_by when object is first created
        if not change or not getattr(obj, 'created_by_id', None):
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ExamQuestion)
class ExamQuestionAdmin(admin.ModelAdmin):
    list_display = ('exam', 'question', 'marks', 'order')
    list_filter = ('exam',)
    search_fields = ('question__title', 'exam__title')
