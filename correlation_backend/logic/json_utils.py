import pandas as pd
import numpy as np
from datetime import datetime


def series_to_timeseries_array(series: pd.Series):
    if series is None or len(series) == 0:
        return []
    
    result = []
    for idx, val in series.items():
        try:
            ts = int(idx)
            value = float(val)
            
            if np.isnan(value) or np.isinf(value):
                continue
                
            result.append({"timestamp": ts, "value": value})
        except Exception:
            continue
    
    return result


def convert_analysis_result(result):
    if result is None:
        return None
    try:
        return tuple(None if (pd.isna(v) or (isinstance(v, float) and (np.isnan(v) or np.isinf(v)))) else float(v) for v in result)
    except Exception:
        return None


def nanoseconds_to_datetime(timestamp_ns: int) -> str:
    try:
        timestamp_seconds = timestamp_ns / 1_000_000_000
        dt = datetime.fromtimestamp(timestamp_seconds)
        return dt.isoformat()
    except Exception:
        return None
