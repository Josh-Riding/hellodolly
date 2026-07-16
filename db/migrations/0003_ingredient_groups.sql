-- Wrap existing flat ingredient arrays into a single unnamed group
UPDATE recipes
SET ingredients = jsonb_build_array(
  jsonb_build_object('name', '', 'items', ingredients)
);
