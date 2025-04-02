from datetime import datetime, timedelta

# Períodos de consulta
    
def get_last_month_range():
    """ Retorna o primeiro e o último dia do mês anterior no formato YYYY-MM-DD """
    today = datetime.today()
    first_day_this_month = today.replace(day=1)
    last_day_last_month = first_day_this_month - timedelta(days=1)
    first_day_last_month = last_day_last_month.replace(day=1)

    return first_day_last_month.strftime("%Y-%m-%d"), last_day_last_month.strftime("%Y-%m-%d")
