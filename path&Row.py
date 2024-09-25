import requests
import pandas as pd

# Variables for the date
year = "2024"
month = "Sep"
day = "25"
filterPath = '201'
filterRow = '105'

# URL template with date variables
url = f"https://landsat.usgs.gov/landsat/all_in_one_pending_acquisition/L9/Pend_Acq/y{year}/{month}/{month}-{day}-{year}.txt"

# Retrieve the content from the URL
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Read the content of the text file
    content = response.text
    
    # Splitting the content into lines
    lines = content.splitlines()
    
    # Find the index of the second "----------------------" line
    separator = "----------------------"
    separator_indices = [index for index, line in enumerate(lines) if separator in line]
    
    if len(separator_indices) >= 2:
        # Extract lines after the second separator
        data_lines = lines[separator_indices[1] + 1:]
        
        # Identify the maximum number of columns across all rows
        max_columns = max(len(line.split()) for line in data_lines if line.strip() != "")
        
        # Adjust the data to ensure each row has the same number of columns
        adjusted_data = [line.split() + [''] * (max_columns - len(line.split())) for line in data_lines if line.strip() != ""]
        
        # Create the DataFrame using the first row as headers
        df = pd.DataFrame(adjusted_data[1:], columns=adjusted_data[0])
        
        # Removing rows that are not part of the actual data
        df = df[df.iloc[:, 0].str.isnumeric() | df.iloc[:, 0].str.contains("[A-Za-z0-9]")]
        
        # Resetting the index for clarity
        df.reset_index(drop=True, inplace=True)
        
        # Filter the rows where both the "path" column (first column) is 201 and the "row" column (second column) is 105
        df_filtered = df[(df.iloc[:, 0] == filterPath) & (df.iloc[:, 1] == filterRow)]
        
        # Check if there's at least one matching row
        if not df_filtered.empty:
            # Extract the value from the third column of the first matching row
            julian = df_filtered.iloc[0, 2]  # Assuming we want the first match
            print("Filtered Data (Path = 201 and Row = 105):")
            print(df_filtered)
            print("\nJulian value:", julian)
        else:
            print("No matching rows found for the specified path and row.")
    else:
        print("The second separator line was not found in the content.")
else:
    print("Failed to retrieve data. Status code:", response.status_code)
