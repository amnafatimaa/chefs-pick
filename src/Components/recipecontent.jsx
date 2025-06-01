import { useState, useEffect } from 'react';
import { getRecipeFromIngredients } from '../AI.js';
import { marked } from 'marked';

export default function Recipe({ ingredients }) {
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchRecipe() {
            if (!ingredients || ingredients.length === 0) {
                setError('No ingredients provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                console.log('Fetching recipe for ingredients:', ingredients);
                const recipeText = await getRecipeFromIngredients(ingredients);
                
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

        fetchRecipe();
    }, [ingredients]);

    if (loading) {
        return (
            <section className="recipe-container">
                <div className="suggested-recipe-container">
                    <p>Generating your personalized recipe... This may take a few moments.</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="recipe-container">
                <div className="suggested-recipe-container">
                    <p className="error-message">{error}</p>
                    <p>Please check that your API key is correctly set in the .env file and try again.</p>
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