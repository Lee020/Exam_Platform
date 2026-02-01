from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Subject, Topic, Question
from .serializers import SubjectSerializer, TopicSerializer, QuestionSerializer
from .permissions import IsAdminOrInstructorOrReadOnly
from rest_framework.response import Response
from rest_framework.decorators import action


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructorOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at']


class TopicViewSet(viewsets.ModelViewSet):
    queryset = Topic.objects.all()
    serializer_class = TopicSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructorOrReadOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at']


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.prefetch_related('choices').all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrInstructorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['subject', 'difficulty', 'status']
    search_fields = ['title']
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Students (non-admin, non-instructor) only see published
        if not getattr(user, 'is_admin', False) and getattr(user, 'role_name', '').upper() != 'INSTRUCTOR':
            return qs.filter(status='PUBLISHED')
        # Instructors see their own questions and published ones
        if getattr(user, 'role_name', '').upper() == 'INSTRUCTOR' and not getattr(user, 'is_admin', False):
            return qs.filter(models.Q(status='PUBLISHED') | models.Q(created_by=user))
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        # Use serializer logic which handles versioning
        return super().update(request, *args, **kwargs)
