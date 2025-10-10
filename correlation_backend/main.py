from fastapi import FastAPI
from pydantic import BaseModel
import os
import pandas as pd
import matplotlib.pyplot as plt
from correlation_backend.logic.calc_analysis import pearson_analysis, spearman_analysis, kendalltau_analysis, linregress_analysis, theilslopes_analysis
from fastapi.middleware.cors import CORSMiddleware
from correlation_backend.logic.read_data import get_target_data_by_instrument, get_comparison_data_by_instrument

pearson_values = None

SPECIFIC_COLUMN_INDEX_1 = 4
SPECIFIC_COLUMN_INDEX_2 = 5

# dfs = read_parquet_files()
# filename, df = next(iter(dfs.items()))
# specific_column_1 = get_specific_column(df, SPECIFIC_COLUMN_INDEX_1)
# specific_column_2 = get_specific_column(df, SPECIFIC_COLUMN_INDEX_2)
# print(specific_column_1)
# print(specific_column_2)

# pearson_values = pearson_analysis(specific_column_1, specific_column_2)
# print(pearson_values)

# spearman_values = spearman_analysis(specific_column_1, specific_column_2)
# print(spearman_values)

# kendalltau_values = kendalltau_analysis(specific_column_1, specific_column_2)
# print(kendalltau_values)

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

class FindFilePath(BaseModel):
    target_instrument: str 
    target_datatype: str
    target_data_column: str

    comparison_instruments: list[str]
    comparison_datatypes: list[str]
    comparison_data_columns: list[str]

    methods: list[str]

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
    comparison_column_contents = get_comparison_data_by_instrument(comparison_instruments, comparison_data_types, comparison_data_columns)

    return {"target_column_content": target_column_content, "comparison_column_contents": comparison_column_contents}
