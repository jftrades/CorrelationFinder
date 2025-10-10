from fastapi import FastAPI
from pydantic import BaseModel
from correlation_backend.logic.calc_analysis import pearson_analysis, spearman_analysis, kendalltau_analysis, linregress_analysis, theilslopes_analysis
from fastapi.middleware.cors import CORSMiddleware
from correlation_backend.logic.read_data import get_target_data_by_instrument, get_comparison_data_by_instrument, get_available_data_columns

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.get("/files")
# async def get_files():
#     return {"files": list(dfs.keys())}

@app.get("/analysismethods")
async def get_analysis_methods():
    return {"analysis_methods": ["pearson", "spearman", "kendalltau"]}

class FindFilePath(BaseModel):
    target_instrument: str 
    target_datatype: str
    target_data_column: str

    comparison_instruments: list[str]
    comparison_datatypes: list[str]
    comparison_data_columns: list[str]

    methods: list[str]


class FindAvailableDataColumns(BaseModel):
    instrument: str
    datatype: str

@app.post("/available-data-columns")
async def find_available_data_columns(body: FindAvailableDataColumns):
    return {"available_data_columns": get_available_data_columns(body.instrument, body.datatype)}

@app.post("/filepath")
async def analyze(request: FindFilePath):
    target_instrument = request.target_instrument
    target_data_type = request.target_datatype
    target_data_column = request.target_data_column
    
    comparison_instruments = request.comparison_instruments
    comparison_data_types = request.comparison_datatypes
    comparison_data_columns = request.comparison_data_columns
    
    methods = request.methods

    target_column_content = get_target_data_by_instrument(target_instrument, target_data_type, target_data_column)
    comparison_data = get_comparison_data_by_instrument(comparison_instruments, comparison_data_types, comparison_data_columns)
    print(comparison_data)

    results = {
        "pearson_results": [],
        "spearman_results": [],
        "kendalltau_results": [],
        "linregress_results": [],
        "theilslopes_results": []
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
        if "theilslopes" in methods:
            theilslopes_result = theilslopes_analysis(target_column_content, content)
            results["theilslopes_results"].append(theilslopes_result)

    return {
        "target_column_content": target_column_content, 
        "comparison_column_contents": comparison_data,
        "pearson_results": results["pearson_results"],
        "spearman_results": results["spearman_results"],
        "kendalltau_results": results["kendalltau_results"],
        "linregress_results": results["linregress_results"],
        "theilslopes_results": results["theilslopes_results"]
        }
