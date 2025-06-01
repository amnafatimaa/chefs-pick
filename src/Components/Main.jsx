import { useState } from "react";
import IngredientsList from "./ingredientslist";
import Recipe from "./recipecontent";

function Main() {
  const [ingredients, setIngredients] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [recipeVisible, setRecipeVisible] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setIngredients([...ingredients, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleDelete = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    if (ingredients.length <= 1) {
      setRecipeVisible(false);
    }
  };

  const handleGenerateRecipe = () => {
    setRecipeVisible(true);
  };

  return (
    <main>
      <h2>What ingredients do you have?</h2>
      <p>Add your ingredients and we'll help you discover delicious recipes.</p>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
            <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter an ingredient"
          />
          <button type="submit">Add</button>
        </form>
      </div>

      {ingredients.length > 0 && (
        <IngredientsList
          ingredients={ingredients}
          onDelete={handleDelete}
          onGenerateRecipe={handleGenerateRecipe}
        />
      )}

      {recipeVisible && ingredients.length >= 3 && (
        <Recipe ingredients={ingredients} />
      )}
    </main>
  );
}

export default Main;
