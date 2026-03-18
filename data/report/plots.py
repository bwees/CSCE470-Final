import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("../all.csv")

df["Release Date"] = pd.to_datetime(df["Release Date"], errors="coerce")
df["Year"] = df["Release Date"].dt.year

genres = df["Genres"].dropna().str.split(", ").explode().str.strip()
genre_counts = genres.value_counts()

lang_counts = df["Original Language"].value_counts().head(20)

fig, axes = plt.subplots(1, 3, figsize=(20, 6))

axes[0].hist(df["Year"].dropna(), bins=30, edgecolor="black")
axes[0].set_title("Distribution of Release Dates")
axes[0].set_xlabel("Year")
axes[0].set_ylabel("Count")

axes[1].barh(genre_counts.index[::-1], genre_counts.values[::-1])
axes[1].set_title("Movies by Genre")
axes[1].set_xlabel("Count")

axes[2].barh(lang_counts.index[::-1], lang_counts.values[::-1])
axes[2].set_title("Movies by Language (Top 20)")
axes[2].set_xlabel("Count")

plt.tight_layout()
plt.savefig("plots.png")
plt.show()
