module Main where

import Prelude

import Effect (Effect)
import Effect.Console (log, logShow)

import Control.Alt ((<|>))
import Data.Either
import Data.List
import Data.Identity
import Data.String.CodeUnits
import Text.Parsing.Parser
import Text.Parsing.Parser.Combinators
import Text.Parsing.Parser.String
import Text.Parsing.Parser.Language
import Text.Parsing.Parser.Token 

main :: Effect Unit
main = do
    log $ show $ compute 6


compute :: Int -> Int
compute x = x * 4


data Def = TypeSynonym String (Array String)        -- type syn identifier, list of elements in tuple
    | Data String                                   -- data identifier
    | Block String (Array String) (Array String)    -- block identifier, input types, output types


p :: TokenParser
p = makeTokenParser haskellDef

typeSynonymP :: Parser String String
typeSynonymP = p.identifier

listToStr :: List Char -> String
listToStr a = fromCharArray $ toUnfoldable a

singleP :: Parser String String
singleP = listToStr <$> (many $ alphaNum <|> oneOf [' ']) -- TODO: dit support dus niet subtuples


-- typeP = 
--     ((\a -> a : Nil) <$> typeIdP) <|>
--     p.parens (typeIdP `sepBy` (char ',' <* p.whiteSpace))
--     where
--         typeIdP = listToStr <$> (many $ alphaNum <|> char ' ')

singleP' :: Parser String (List String)
singleP' = (\a -> a : Nil) <$> singleP

tupleP :: Parser String (List String)
tupleP = p.parens (p.identifier `sepBy` (char ',' <* p.whiteSpace))

typeP :: Parser String (List String)
typeP = tupleP <|> singleP'

-- typedefP :: Parser String (String)
-- typedefP = (\a b -> a : b : Nil) <$> 
--     (string "type" *> p.whiteSpace) *> typeSynonymP <*> 
--     (p.whiteSpace *> char '=' *> p.whiteSpace *> string "test")

-- typeOrTypesP :: Parser String [String]
-- typeOrTypesP = 


typedefP = (\a b -> (a <> " = " <> show b)) <$> 
    (string "type" *> p.whiteSpace *> typeSynonymP <* p.whiteSpace <* char '=') 
    <* p.whiteSpace <*> (typeP <* char '\n')