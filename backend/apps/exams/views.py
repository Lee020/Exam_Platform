from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Exam, ExamQuestion
from .serializers import ExamSerializer, ExamQuestionSerializer, ProvideQuestionToExamSerializer
from .permissions import IsExamOwnerOrReadOnly
from apps.users.permissions import IsAdminOrInstructor
from django_filters.rest_framework import DjangoFilterBackend
from apps.attempts.models import Attempt
from apps.attempts.analytics_serializers import ExamAttemptAnalyticsSerializer
from apps.users.models import AuditLog

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'add_question', 'remove_question']:
            return [IsAdminOrInstructor()]
        if self.action in ['analytics', 'monitoring']:
            return [IsAdminOrInstructor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Students only see published exams
        if getattr(user, 'role_name', '').upper() == 'STUDENT':
             # Students can see everything, but UI will restrict taking draft exams
             return qs
        return qs


    @action(detail=True, methods=['post'], url_path='add-question')
    def add_question(self, request, pk=None):
        exam = self.get_object()
        serializer = ProvideQuestionToExamSerializer(data=request.data)
        if serializer.is_valid():
            question = serializer.validated_data['question_id']
            marks = serializer.validated_data['marks']
            order = serializer.validated_data['order']
            
            obj, created = ExamQuestion.objects.update_or_create(
                exam=exam,
                question=question,
                defaults={'marks': marks, 'order': order}
            )
            return Response({'status': 'success', 'message': 'Question added to exam'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='remove-question')
    def remove_question(self, request, pk=None):
        exam = self.get_object()
        question_id = request.data.get('question_id')
        if not question_id:
             return Response({'detail': 'question_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        deleted, _ = ExamQuestion.objects.filter(exam=exam, question_id=question_id).delete()
        if deleted:
            return Response({'status': 'success', 'message': 'Question removed from exam'})
        return Response({'detail': 'Question not found in exam'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'], url_path='analytics')
    def analytics(self, request, pk=None):
        exam = self.get_object()
        attempts = Attempt.objects.filter(exam=exam).select_related('user')
        serializer = ExamAttemptAnalyticsSerializer(attempts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='monitoring')
    def monitoring(self, request, pk=None):
        """Live monitoring of active attempts"""
        exam = self.get_object()
        active_attempts = Attempt.objects.filter(
            exam=exam, 
            status='STARTED'
        ).select_related('user')
        
        # We can use the same analytics serializer or a more compact one
        serializer = ExamAttemptAnalyticsSerializer(active_attempts, many=True)
        return Response({
            'exam_title': exam.title,
            'active_count': active_attempts.count(),
            'students': serializer.data
        })

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user,
            action='DELETE_EXAM',
            resource='EXAM',
            resource_id=str(instance.id),
            details={'title': instance.title},
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        instance.delete()

class ExamQuestionViewSet(viewsets.ModelViewSet):
    queryset = ExamQuestion.objects.all()
    serializer_class = ExamQuestionSerializer
    permission_classes = [IsAuthenticated, IsExamOwnerOrReadOnly]
