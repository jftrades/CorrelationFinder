from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from correlation_backend.logic.calc_analysis import pearson_analysis, spearman_analysis, kendalltau_analysis, linregress_analysis
from fastapi.middleware.cors import CORSMiddleware
from correlation_backend.logic.read_data import (
    get_target_data_by_instrument, 
    get_comparison_data_by_instrument, 
    get_available_data_columns,
    get_available_instruments,
    get_available_datatypes,
    get_timestamp_range_for_datatype,
    align_series_with_offset
)
from correlation_backend.logic.json_utils import series_to_timeseries_array, nanoseconds_to_datetime
import json
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        return super().default(obj)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/analysismethods")
async def get_analysis_methods():
    return {"analysis_methods": ["pearson", "spearman", "kendalltau"]}

@app.get("/available-instruments")
async def get_instruments():
    return {"instruments": get_available_instruments()}

class GetDatatypesRequest(BaseModel):
    instrument: str

@app.post("/available-datatypes")
async def get_datatypes(body: GetDatatypesRequest):
    return {"datatypes": get_available_datatypes(body.instrument)}

class GetTimestampRangeRequest(BaseModel):
    instrument: str
    datatype: str

@app.post("/timestamp-range")
async def get_timestamp_range(body: GetTimestampRangeRequest):
    timestamp_range = get_timestamp_range_for_datatype(body.instrument, body.datatype)
    if timestamp_range:
        timestamp_range['min_datetime'] = nanoseconds_to_datetime(timestamp_range['min_timestamp'])
        timestamp_range['max_datetime'] = nanoseconds_to_datetime(timestamp_range['max_timestamp'])
        return timestamp_range
    else:
        return {"error": "No timestamp data found for the specified instrument and datatype"}

class FindFilePath(BaseModel):
    target_instrument: str 
    target_datatype: str
    target_data_column: str
    comparison_instruments: list[str]
    comparison_datatypes: list[str]
    comparison_data_columns: list[str]
    methods: list[str]
    start_month: str
    start_year: str
    end_month: str
    end_year: str
    offset: int = 0


class FindAvailableDataColumns(BaseModel):
    instrument: list[str]
    datatype: list[str]

@app.post("/available-data-columns")
async def find_available_data_columns(body: FindAvailableDataColumns):
    return {"available_data_columns": get_available_data_columns(body.instrument, body.datatype)}

@app.post("/analysedData")
async def analyze(request: FindFilePath):
    try:
        from datetime import datetime
        
        start_ts = int(datetime(int(request.start_year), int(request.start_month), 1).timestamp() * 1_000_000_000)
        end_year = int(request.end_year)
        end_month = int(request.end_month)
        next_month = end_month + 1 if end_month < 12 else 1
        next_year = end_year if end_month < 12 else end_year + 1
        end_ts = int(datetime(next_year, next_month, 1).timestamp() * 1_000_000_000)

        target_column_content = get_target_data_by_instrument(
            request.target_instrument, 
            request.target_datatype, 
            request.target_data_column
        )
        comparison_data = get_comparison_data_by_instrument(
            request.comparison_instruments, 
            request.comparison_datatypes, 
            request.comparison_data_columns
        )
        
        if target_column_content is None or len(comparison_data) == 0:
            return {"error": "No data found for the selected instruments/columns"}

        target_column_content = target_column_content[(target_column_content.index >= start_ts) & (target_column_content.index < end_ts)]
        comparison_data = [s[(s.index >= start_ts) & (s.index < end_ts)] for s in comparison_data]

        results = {"pearson_results": [], "spearman_results": [], "kendalltau_results": [], "linregress_results": []}
        
        for content in comparison_data:
            aligned_target, aligned_comparison = align_series_with_offset(target_column_content, content, request.offset)
            
            if aligned_target is None or aligned_comparison is None or len(aligned_target) == 0 or len(aligned_comparison) == 0:
                results["pearson_results"].append((None, None))
                results["spearman_results"].append((None, None))
                results["kendalltau_results"].append((None, None))
                results["linregress_results"].append((None, None, None, None, None))
                continue
            
            if "pearson" in request.methods:
                results["pearson_results"].append(pearson_analysis(aligned_target, aligned_comparison))
            if "spearman" in request.methods:
                results["spearman_results"].append(spearman_analysis(aligned_target, aligned_comparison))
            if "kendalltau" in request.methods:
                results["kendalltau_results"].append(kendalltau_analysis(aligned_target, aligned_comparison))
            if "linregress" in request.methods:
                results["linregress_results"].append(linregress_analysis(aligned_target, aligned_comparison))
        
        response_data = {
            "target_column_content": series_to_timeseries_array(target_column_content), 
            "comparison_column_contents": [series_to_timeseries_array(s) for s in comparison_data],
            **results
        }
        
        return JSONResponse(content=json.loads(json.dumps(response_data, cls=NumpyEncoder)))
    except Exception as e:
        print(f"Error in analyze: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}