import streamlit as st
import pandas as pd

st.title("💰 Personal Expense Tracker")

# Input fields
date = st.date_input("Date")
category = st.selectbox("Category", ["Food", "Travel", "Shopping", "Other"])
amount = st.number_input("Amount", min_value=0)
note = st.text_input("Note")

# Save data
if st.button("Add Expense"):
    data = pd.DataFrame([[date, category, amount, note]],
                        columns=["Date", "Category", "Amount", "Note"])
    
    try:
        old = pd.read_csv("expenses.csv")
        data = pd.concat([old, data], ignore_index=True)
    except:
        pass
    
    data.to_csv("expenses.csv", index=False)
    st.success("Expense added!")

# Show data
try:
    df = pd.read_csv("expenses.csv")
    st.subheader("Your Expenses")
    st.dataframe(df)
    
    st.subheader("Total खर्च")
    st.write(df["Amount"].sum())
except:
    st.write("No data yet")