import pandas as pd
import os

# Define the base directory path
base_dir = os.path.dirname(os.path.abspath(__file__))

# Load the dataset
recommendation_data = pd.read_pickle(os.path.join(base_dir, 'recommendation_data.pkl'))

# Inspect the dataset
print(recommendation_data.head())
print("Number of records:", len(recommendation_data))
