export const categoryMap = {
  Health: { icon: "❤️", color: "#ef4444" },
  Fitness: { icon: "💪", color: "#4cb071" },
  Study: { icon: "📚", color: "#3b82f6" },
  Reading: { icon: "📖", color: "#7b6491" },
  Productivity: { icon: "⚡", color: "#f59e0b" },
  Mindfulness: { icon: "🧘", color: "#14b8a6" },
  Social: { icon: "👥", color: "#ec4899" },
  Custom: { icon: "📌", color: "#6b7280" }

};

export function getCategoryData(category) {
  const normalizedCategory = category?.trim();
  return categoryMap[normalizedCategory] || categoryMap.Custom;
}
