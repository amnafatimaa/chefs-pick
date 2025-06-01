// First check if we have an API key
if (!import.meta.env.VITE_SPOONACULAR_API_KEY) {
    console.error('No API key found! Make sure VITE_SPOONACULAR_API_KEY is set in your .env file');
}

// Simple cache for storing previous recipe results
const recipeCache = new Map();

export async function getRecipeFromIngredients(ingredientsArr) {
    console.log('Starting recipe search with ingredients:', ingredientsArr);
    
    if (!ingredientsArr || ingredientsArr.length === 0) {
        console.error('No ingredients provided');
        throw new Error('No ingredients provided');
    }

    // Sort ingredients to ensure consistent cache keys
    const sortedIngredients = [...ingredientsArr].sort().join(',');
    console.log('Sorted ingredients:', sortedIngredients);
    
    // Check cache first
    if (recipeCache.has(sortedIngredients)) {
        console.log('Cache hit! Returning cached recipe');
        return recipeCache.get(sortedIngredients);
    }
    console.log('No cache found, proceeding with API call');

    try {
        // First, find recipes by ingredients
        const searchResponse = await fetch(
            `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(sortedIngredients)}&number=5&ranking=1&ignorePantry=false&apiKey=${import.meta.env.VITE_SPOONACULAR_API_KEY}`
        );

        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            throw new Error(errorData.message || 'Failed to search for recipes');
        }

        const searchResults = await searchResponse.json();
        
        if (!searchResults || searchResults.length === 0) {
            throw new Error('No recipes found for these ingredients');
        }

        // Find the recipe that uses the most of our ingredients
        const bestMatch = searchResults.reduce((best, current) => {
            const usedIngredientCount = current.usedIngredientCount || 0;
            const missedIngredientCount = current.missedIngredientCount || 0;
            const bestUsedCount = best.usedIngredientCount || 0;
            const bestMissedCount = best.missedIngredientCount || 0;
            
            // Prefer recipes that use more of our ingredients
            if (usedIngredientCount > bestUsedCount) return current;
            if (usedIngredientCount === bestUsedCount && missedIngredientCount < bestMissedCount) return current;
            return best;
        }, searchResults[0]);

        // Get detailed recipe information
        const recipeId = bestMatch.id;
        const detailResponse = await fetch(
            `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${import.meta.env.VITE_SPOONACULAR_API_KEY}`
        );

        if (!detailResponse.ok) {
            const errorData = await detailResponse.json();
            throw new Error(errorData.message || 'Failed to get recipe details');
        }

        const recipeDetails = await detailResponse.json();

        // Format the recipe in our desired markdown format
        const formattedRecipe = `# ${recipeDetails.title}

## Ingredients Used From Your List
${bestMatch.usedIngredients.map(ing => `- ${ing.original}`).join('\n')}

## Additional Ingredients Needed
${bestMatch.missedIngredients.map(ing => `- ${ing.original}`).join('\n')}

## Instructions
${recipeDetails.instructions ? recipeDetails.instructions.replace(/<[^>]*>/g, '') : 'No instructions available for this recipe.'}`;

        // Cache the result
        recipeCache.set(sortedIngredients, formattedRecipe);
        console.log('Recipe cached successfully');
        
        // If cache gets too large, remove oldest entries
        if (recipeCache.size > 50) {
            const firstKey = recipeCache.keys().next().value;
            recipeCache.delete(firstKey);
            console.log('Cache pruned - removed oldest entry');
        }

        return formattedRecipe;
    } catch (err) {
        console.error('API Error:', err);
        throw new Error(`Failed to generate recipe: ${err.message}`);
    }
}

