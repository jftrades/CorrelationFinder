from fastapi import FastAPI
import os
import pandas as pd
import matplotlib.pyplot as plt
from correlation_backend.logic.read_data import read_parquet_files, get_specific_column
from correlation_backend.logic.calc_analysis import pearson_analysis, spearman_analysis, kendalltau_analysis, linregress_analysis, theilslopes_analysis
from fastapi.middleware.cors import CORSMiddleware

pearson_values = None

SPECIFIC_COLUMN_INDEX_1 = 4
SPECIFIC_COLUMN_INDEX_2 = 5

dfs = read_parquet_files()
filename, df = next(iter(dfs.items()))
specific_column_1 = get_specific_column(df, SPECIFIC_COLUMN_INDEX_1)
specific_column_2 = get_specific_column(df, SPECIFIC_COLUMN_INDEX_2)
print(specific_column_1)
print(specific_column_2)

pearson_values = pearson_analysis(specific_column_1, specific_column_2)
print(pearson_values)

spearman_values = spearman_analysis(specific_column_1, specific_column_2)
print(spearman_values)

kendalltau_values = kendalltau_analysis(specific_column_1, specific_column_2)
print(kendalltau_values)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"pearson_values": pearson_values, "spearman_values": spearman_values, "kendalltau_values": kendalltau_values}
