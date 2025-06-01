export default function IngredientsList({ ingredients, onDelete, onGenerateRecipe }) {
  return (
    <>
      <ul className="ingredients-list">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="ingredient-item">
            {ingredient}
            <button 
              className="delete-button" 
              onClick={() => onDelete(index)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {ingredients.length >= 3 && (
        <div className="getRecipe">
          <p>Ready to cook? Let's find a recipe for you!</p>
          <button onClick={onGenerateRecipe}>Generate Recipe</button>
        </div>
      )}
    </>
  );
}