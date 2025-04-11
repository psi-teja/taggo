from datetime import datetime
import pytz

def get_current_time_ist():
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.now().astimezone(ist).strftime('%H:%M:%S (%d-%b-%y)')