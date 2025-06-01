import { useState, useEffect } from 'react';
import { getRecipeFromIngredients } from '../AI.js';
import { marked } from 'marked';

export default function Recipe({ ingredients }) {
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recipeCount, setRecipeCount] = useState(0);

    async function fetchRecipe(skip = 0) {
        if (!ingredients || ingredients.length === 0) {
            setError('No ingredients provided');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('Fetching recipe for ingredients:', ingredients);
            const recipeText = await getRecipeFromIngredients(ingredients, skip);
            
            if (!recipeText || typeof recipeText !== 'string') {
                throw new Error('Invalid recipe format received');
            }
            
            setRecipe(recipeText);
        } catch (err) {
            console.error('Recipe generation error:', err);
            setError(err.message || 'Failed to generate recipe. Please try again.');
            setRecipe(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setRecipeCount(0); // Reset count when ingredients change
        fetchRecipe(0);
    }, [ingredients]);

    const handleGenerateAnother = async () => {
        const nextCount = recipeCount + 1;
        setRecipeCount(nextCount);
        await fetchRecipe(nextCount);
    };

    if (loading) {
        return (
            <section className="recipe-container">
                <div className="suggested-recipe-container">
                   
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="recipe-container">
                <div className="suggested-recipe-container">
                    <p className="error-message">{error}</p>
                    {error.includes('No more recipes') ? (
                        <p>We've shown you all available recipes for these ingredients.</p>
                    ) : (
                        <h1>Error</h1>
                    )}
                </div>
            </section>
        );
    }

    if (!recipe) {
        return null;
    }

    try {
        const htmlContent = marked(recipe);
        return (
            <section className="recipe-container">
                <article 
                    className="suggested-recipe-container" 
                    aria-live="polite"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                <div className="recipe-actions">
                    <button 
                        onClick={handleGenerateAnother}
                        className="generate-another-btn"
                    >
                        Generate Another Recipe
                    </button>
                </div>
            </section>
        );
    } catch (err) {
        console.error('Markdown rendering error:', err);
        return (
            <section className="recipe-container">
                <div className="suggested-recipe-container">
                    <p className="error-message">Error displaying recipe. Please try again.</p>
                    <pre>{recipe}</pre>
                </div>
            </section>
        );
    }
}