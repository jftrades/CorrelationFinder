# JSON Serialization Fix

## Problem
Pandas int64/float64 types weren't JSON-serializable → `.map()` failed in frontend + CORS errors

## Solution

### Backend Changes

**`json_utils.py`** (NEW)
- `series_to_timeseries_array()` - Handles all timestamp types (int, Timestamp, string), converts to ms
- `convert_analysis_result()` - Converts numpy/pandas floats + handles NaN/Inf
- Robust error handling for different data formats

**`read_data.py`**, **`calc_analysis.py`**, **`main.py`**
- Fixed imports (removed `correlation_backend.` prefix)
- Returns array format: `[{timestamp, value}, ...]`
- CORS fixed: `allow_origins=["http://localhost:5173"]`, `allow_credentials=True`

### Frontend (Already Done)
- TypeScript interfaces: `TimeSeriesDataPoint`, `AnalysedDataResponse`
- Direct array operations in `d3_charts.tsx`

## Data Format
**Before:** `{"1672535700000000000": 1094115.638}` (string keys, nanoseconds)  
**After:** `[{"timestamp": 1672535700000, "value": 1094115.638}]` (array, milliseconds)

## Backend Running
```bash
cd correlation_backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Works with all data types: LUNAR, metrics, bar data.
