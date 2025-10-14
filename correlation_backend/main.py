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
    get_available_datatypes
)
from correlation_backend.logic.json_utils import series_to_timeseries_array
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

# @app.get("/files")
# async def get_files():
#     return {"files": list(dfs.keys())}

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

class FindFilePath(BaseModel):
    target_instrument: str 
    target_datatype: str
    target_data_column: str

    comparison_instruments: list[str]
    comparison_datatypes: list[str]
    comparison_data_columns: list[str]

    methods: list[str]


class FindAvailableDataColumns(BaseModel):
    instrument: list[str]
    datatype: list[str]

@app.post("/available-data-columns")
async def find_available_data_columns(body: FindAvailableDataColumns):
    return {"available_data_columns": get_available_data_columns(body.instrument, body.datatype)}

@app.post("/analysedData")
async def analyze(request: FindFilePath):
    try:
        target_instrument = request.target_instrument
        target_data_type = request.target_datatype
        target_data_column = request.target_data_column
        
        comparison_instruments = request.comparison_instruments
        comparison_data_types = request.comparison_datatypes
        comparison_data_columns = request.comparison_data_columns
        
        methods = request.methods

        target_column_content = get_target_data_by_instrument(target_instrument, target_data_type, target_data_column)
        comparison_data = get_comparison_data_by_instrument(comparison_instruments, comparison_data_types, comparison_data_columns)
        
        if target_column_content is None or len(comparison_data) == 0:
            return {"error": "No data found for the selected instruments/columns"}

        results = {
            "pearson_results": [],
            "spearman_results": [],
            "kendalltau_results": [],
            "linregress_results": [],
        }
        
        for content in comparison_data:
            if "pearson" in methods:
                pearson_result = pearson_analysis(target_column_content, content)
                results["pearson_results"].append(pearson_result)
            if "spearman" in methods:
                spearman_result = spearman_analysis(target_column_content, content)
                results["spearman_results"].append(spearman_result)
            if "kendalltau" in methods:
                kendalltau_result = kendalltau_analysis(target_column_content, content)
                results["kendalltau_results"].append(kendalltau_result)
            if "linregress" in methods:
                linregress_result = linregress_analysis(target_column_content, content)
                results["linregress_results"].append(linregress_result)
        
        target_json = series_to_timeseries_array(target_column_content)
        comparison_json = [series_to_timeseries_array(s) for s in comparison_data]
        
        response_data = {
            "target_column_content": target_json, 
            "comparison_column_contents": comparison_json,
            "pearson_results": results["pearson_results"],
            "spearman_results": results["spearman_results"],
            "kendalltau_results": results["kendalltau_results"],
            "linregress_results": results["linregress_results"],
        }
        
        return JSONResponse(content=json.loads(json.dumps(response_data, cls=NumpyEncoder)))
    except Exception as e:
        print(f"Error in analyze: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}