from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

class SchedulerService:
    def __init__(self, app=None):
        self.scheduler = BackgroundScheduler()
        self.app = None
        if app:
            self.init_app(app)

    def init_app(self, app):
        self.app = app
        if not self.scheduler.running:
            self.scheduler.start()
            logging.info("Scheduler started")

    def add_job(self, job_id, schedule_expression, func, **kwargs):
        """
        Add a job to the scheduler.
        :param job_id: Unique ID for the job
        :param schedule_expression: Cron expression (e.g. "0 9 * * *")
        :param func: Function to execute
        :param kwargs: Arguments to pass to the function
        """
        try:
            # Remove existing job if it exists to update it
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)

            if not schedule_expression:
                return

            self.scheduler.add_job(
                id=job_id,
                func=func,
                trigger=CronTrigger.from_crontab(schedule_expression),
                replace_existing=True,
                **kwargs
            )
            logging.info(f"Scheduled job {job_id} with cron {schedule_expression}")
        except Exception as e:
            logging.error(f"Failed to schedule job {job_id}: {str(e)}")

    def remove_job(self, job_id):
        """Remove a job from the scheduler."""
        try:
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
                logging.info(f"Removed job {job_id} from scheduler")
        except Exception as e:
            logging.error(f"Failed to remove job {job_id}: {str(e)}")

    def get_future_runs(self, schedule_expression, limit=5):
        """
        Calculate future run times for a cron expression.
        """
        try:
            from datetime import datetime
            import pytz
            
            # Create a trigger from the expression
            trigger = CronTrigger.from_crontab(schedule_expression)
            
            next_dates = []
            # Start from current time
            # APScheduler uses timezone aware datetimes usually
            now = datetime.now(pytz.utc)
            
            previous_fire_time = now
            
            for _ in range(limit):
                # get_next_fire_time(previous_fire_time, now)
                next_date = trigger.get_next_fire_time(previous_fire_time, now)
                
                if next_date:
                    next_dates.append(next_date.isoformat())
                    previous_fire_time = next_date
                else:
                    break
                    
            return next_dates
        except Exception as e:
            logging.error(f"Error calculating future runs: {e}")
            return []

    def get_runs_in_range(self, schedule_expression, start_date_iso, end_date_iso):
        """
        Calculate all run times for a cron expression within a date range.
        """
        try:
            from datetime import datetime
            import pytz
            
            trigger = CronTrigger.from_crontab(schedule_expression)
            
            # Parse ISO strings
            # Handle 'Z' manually if python version is old, but fromisoformat usually handles it in newer versions
            # Or use replacing Z with +00:00
            start_date = datetime.fromisoformat(str(start_date_iso).replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(str(end_date_iso).replace('Z', '+00:00'))
            
            # Ensure UTC
            if start_date.tzinfo is None: start_date = start_date.replace(tzinfo=pytz.utc)
            else: start_date = start_date.astimezone(pytz.utc)
            
            if end_date.tzinfo is None: end_date = end_date.replace(tzinfo=pytz.utc)
            else: end_date = end_date.astimezone(pytz.utc)
            
            next_dates = []
            # We want runs occurring AFTER start_date
            # We use start_date as the reference point
            current_ref = start_date
            
            # Safety limit to prevent infinite loops if end_date is too far or cron is every second
            MAX_RUNS = 1000 
            
            while len(next_dates) < MAX_RUNS:
                # get_next_fire_time(previous_fire_time, now)
                # We pass current_ref as both to simulate "what is the next run after this time"
                next_date = trigger.get_next_fire_time(current_ref, current_ref)
                
                if not next_date:
                    break
                
                if next_date > end_date:
                    break
                
                next_dates.append(next_date.isoformat())
                current_ref = next_date
                
            return next_dates
        except Exception as e:
            logging.error(f"Error calculating runs in range: {e}")
            return []

# Global instance
scheduler_service = SchedulerService()
