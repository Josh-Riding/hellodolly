ALTER TABLE recipes ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

UPDATE recipes SET
  category = CASE
    WHEN tags && ARRAY['Meal','meal','lunch','Lunch','dinner','Dinner','breakfast','Breakfast'] THEN 'Meal'
    WHEN tags && ARRAY['Dessert','dessert'] THEN 'Dessert'
    WHEN tags && ARRAY['Appetizer','appetizer'] THEN 'Appetizer'
    WHEN tags && ARRAY['Snack','snack'] THEN 'Snack'
    WHEN tags && ARRAY['Salad','salad'] THEN 'Salad'
    WHEN tags && ARRAY['Soup','soup'] THEN 'Soup'
    WHEN tags && ARRAY['Side','side'] THEN 'Side'
    WHEN tags && ARRAY['Bread','bread'] THEN 'Bread'
    WHEN tags && ARRAY['Drink','drink'] THEN 'Drink'
    ELSE NULL
  END,
  tags = ARRAY(
    SELECT t FROM unnest(tags) AS t
    WHERE lower(t) NOT IN ('meal','lunch','dinner','breakfast','dessert','appetizer','snack','salad','soup','side','bread','drink')
  );
