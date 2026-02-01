from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Attempt
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Attempt)
def send_exam_completion_email(sender, instance, created, **kwargs):
    """
    Mock email notification when an attempt is completed.
    """
    if not created and instance.status == 'COMPLETED':
        subject = f"Exam Completed: {instance.exam.title}"
        message = f"Hello {instance.user.username},\n\nYou have successfully completed the exam '{instance.exam.title}'.\nYour score: {instance.score}\n\nThank you for using Exam Platform."
        
        # Mock sending email (logs to console by default if EMAIL_BACKEND is console)
        try:
            send_mail(
                subject,
                message,
                'noreply@examplatform.local',
                [instance.user.email],
                fail_silently=False,
            )
            logger.info(f"Exam completion email sent to {instance.user.email}")
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
