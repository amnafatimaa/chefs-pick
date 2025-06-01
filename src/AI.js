// First check if we have an API key
if (!import.meta.env.VITE_SPOONACULAR_API_KEY) {
    console.error('No API key found! Make sure VITE_SPOONACULAR_API_KEY is set in your .env file');
}

// Cache structure to store multiple recipes per ingredient combination
const recipeCache = new Map();

export async function getRecipeFromIngredients(ingredientsArr, skipCount = 0) {
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
        const cachedRecipes = recipeCache.get(sortedIngredients);
        // If we have more recipes in cache, return the next one
        if (cachedRecipes.length > skipCount) {
            console.log(`Cache hit! Returning recipe ${skipCount + 1} of ${cachedRecipes.length}`);
            return cachedRecipes[skipCount];
        }
    }
    
    console.log('Fetching new recipes from API');

    try {
        // First, find recipes by ingredients with better parameters
        const searchResponse = await fetch(
            `https://api.spoonacular.com/recipes/findByIngredients?` + 
            `ingredients=${encodeURIComponent(sortedIngredients)}&` +
            `number=5&` +
            `ranking=2&` + // Changed to 2 for maximize used ingredients
            `ignorePantry=true&` + // Changed to true to focus on user's ingredients
            `fillIngredients=true&` + // Get full ingredient details
            `apiKey=${import.meta.env.VITE_SPOONACULAR_API_KEY}`
        );

        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            throw new Error(errorData.message || 'Failed to search for recipes');
        }

        const searchResults = await searchResponse.json();
        
        if (!searchResults || searchResults.length === 0) {
            throw new Error('No recipes found for these ingredients');
        }

        // Sort results by number of used ingredients and missing ingredients
        searchResults.sort((a, b) => {
            const aUsed = a.usedIngredientCount || 0;
            const bUsed = b.usedIngredientCount || 0;
            const aMissed = a.missedIngredientCount || 0;
            const bMissed = b.missedIngredientCount || 0;
            
            // Prioritize recipes that use more ingredients
            if (aUsed !== bUsed) return bUsed - aUsed;
            // If same number of used ingredients, prefer fewer missing ingredients
            return aMissed - bMissed;
        });

        // Process all recipes
        const processedRecipes = [];
        for (const recipe of searchResults) {
            // Skip recipes that use less than 2 of the provided ingredients
            if (recipe.usedIngredientCount < 2) continue;

            try {
                // Get detailed recipe information
                const detailResponse = await fetch(
                    `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${import.meta.env.VITE_SPOONACULAR_API_KEY}`
                );

                if (!detailResponse.ok) {
                    console.warn(`Failed to get details for recipe ${recipe.id}, skipping`);
                    continue;
                }

                const recipeDetails = await detailResponse.json();

                // Format the recipe in our desired markdown format
                const formattedRecipe = `# ${recipeDetails.title}

## Ingredients Used From Your List (${recipe.usedIngredientCount} ingredients)
${recipe.usedIngredients.map(ing => `- ${ing.original}`).join('\n')}

## Additional Ingredients Needed (${recipe.missedIngredientCount} ingredients)
${recipe.missedIngredients.map(ing => `- ${ing.original}`).join('\n')}

## Instructions
${recipeDetails.instructions ? recipeDetails.instructions.replace(/<[^>]*>/g, '') : 'No instructions available for this recipe.'}

## Recipe Summary
- Preparation Time: ${recipeDetails.readyInMinutes || 'N/A'} minutes
- Servings: ${recipeDetails.servings || 'N/A'}
${recipeDetails.sourceUrl ? `- Original Recipe: [${recipeDetails.sourceName || 'Source'}](${recipeDetails.sourceUrl})` : ''}`;

                processedRecipes.push(formattedRecipe);
            } catch (err) {
                console.warn(`Error processing recipe ${recipe.id}:`, err);
                continue;
            }
        }

        if (processedRecipes.length === 0) {
            throw new Error('No suitable recipes found for your ingredients. Try adding more ingredients or different combinations.');
        }

        // Store all recipes in cache
        recipeCache.set(sortedIngredients, processedRecipes);
        console.log(`Cached ${processedRecipes.length} recipes`);
        
        // If cache gets too large, remove oldest entries
        if (recipeCache.size > 20) {
            const firstKey = recipeCache.keys().next().value;
            recipeCache.delete(firstKey);
            console.log('Cache pruned - removed oldest entry');
        }

        // Return the requested recipe
        if (processedRecipes.length > skipCount) {
            return processedRecipes[skipCount];
        } else {
            throw new Error('No more recipes available for these ingredients');
        }
    } catch (err) {
        console.error('API Error:', err);
        throw new Error(`Failed to generate recipe: ${err.message}`);
    }
}

