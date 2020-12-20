module Main where

import Prelude

import Effect (Effect)
import Effect.Console (log, logShow)

import Control.Alt ((<|>))
import Data.Either
import Data.List
import Data.Identity
import Data.Show
import Data.String.CodeUnits
import Text.Parsing.Parser
import Text.Parsing.Parser.Combinators
import Text.Parsing.Parser.String
import Text.Parsing.Parser.Language
import Text.Parsing.Parser.Token 

{-
Toevoegingen:

- Maybes ondersteunen met een blokje waarbij je in kan stellen wat er met de nothing case gebeurt.
- specaal bram block omdat ie een spannend type heeft?
- specifieke unbundle blokjes voor subtuples

-}

main :: Effect Unit
main = do
    log $ show $ compute 6


compute :: Int -> Int
compute x = x * 4


data Def = TypeSynonym String (Array String)       -- type syn identifier, list of elements in tuple
    | Data String                                 -- data identifier
    | Block String (Array String) (Array String)    -- block identifier, input types, output types


instance showDef :: Show Def where
    show (TypeSynonym a b) = "TypeSynonym " <> show a <> " " <> show b
    show (Data a) = "Data " <> show a
    show (Block a b c) = "Block " <> show a <> " " <> show b <> " " <> show c


p :: TokenParser
p = makeTokenParser haskellDef

typeSynonymP :: Parser String String
typeSynonymP = p.identifier

listToStr :: List Char -> String
listToStr a = fromCharArray $ toUnfoldable a

unwords :: List (List Char) -> List Char
unwords lc = intercalate (' ' : Nil) (lc)

singleP :: Parser String String
singleP = listToStr <$>  -- TODO: dit support dus niet subtuples
    (try ( unwords <$> (some $ alphaNum) `sepBy1` char ' ') <|>
    (some $ alphaNum))


singleP' :: Parser String (List String)
singleP' = (\a -> a : Nil) <$> singleP

tupleP :: Parser String (List String)
tupleP = p.parens (singleP `sepBy` (char ',' <* p.whiteSpace))

typeP :: Parser String (Array String)
typeP = toUnfoldable <$> (tupleP <|> singleP')


-- TODO: p.identifier enforced niet het beginnen met een hoofdletter
typedefP :: Parser String Def
typedefP = (TypeSynonym) <$> 
    (string "type" *> p.whiteSpace *> p.identifier <* p.whiteSpace <* char '=') 
    <* p.whiteSpace <*> (typeP)


datadefP :: Parser String Def
datadefP = Data <$> 
    (string "data" *> p.whiteSpace *> p.identifier <* p.whiteSpace <* char '='
    <* p.whiteSpace <* (many (alphaNum <|> oneOf [' ', '|'])))


blockdefP :: Parser String Def
blockdefP = Block <$>
    (string "mealy" *> p.whiteSpace *> p.identifier <* p.whiteSpace <* string "::" <* p.whiteSpace) <*>
    (typeP <* p.whiteSpace) <*>
    (string "->" *> p.whiteSpace *> typeP)


alldefsP :: Parser String (Array Def)
alldefsP = toUnfoldable <$> statements
    where
        statements = (datadefP <|> blockdefP <|> typedefP) `sepEndBy` (p.whiteSpace)

parse :: String -> Either ParseError (Array Def)
parse str = runParser str alldefsP





test = "type Operand = Signed 16\ntype Addr = Unsigned 4\ndata StackInstr = Push Operand | Pop | Nop\nmealy stack :: StackInstr -> (Operand, Addr)\ntype BRAMinput = (Addr, MaybeAddrOperand)\n"