module Main where

import Prelude

import Effect (Effect)
import Effect.Console (log, logShow)

import Control.Alt ((<|>))
import Data.Either
import Data.Array hiding (toUnfoldable, many, (:), some)
import Data.List hiding (length, (!!), init, last, filter, mapWithIndex, updateAt)
import Data.Identity
import Data.Show
import Data.Maybe
import Data.String.CodeUnits hiding (length)
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



-- TODO: nu het connecten mogelijk is kunnen we vanuit een lijst van connecties code gaan gereneren. succes :P


type Type = String
type BlockId = String
type SigIdx = Int

data Block = Blk String (Array Type) (Array Type)

instance showBlock :: Show Block where
    show (Blk id i o) = "Blk " <> show id <> " " <> show i <> " " <> show o

data Connection = Conn Output Input

instance showConnection :: Show Connection where
    show (Conn i o) = "Conn " <> show i <> " " <> show o

data Input = Input BlockId SigIdx
data Output = Output BlockId SigIdx

instance showInput :: Show Input where
    show (Input bid sigidx) = "Input " <> show bid <> " " <> show sigidx


instance showOutput :: Show Output where
    show (Output bid sigidx) = "Output " <> show bid <> " " <> show sigidx

blocks :: Array Block
blocks = [
    Blk "xor" ["Unsigned 1", "Unsigned 1"] ["Unsigned 1"], 
    Blk "reg" ["Unsigned 1"] ["Unsigned 1"],
    Blk "not" ["Unsigned 1"] ["Unsigned 1"]]

conns :: Array Connection
conns = [
    Conn (Output "xor" 0) (Input "not" 0),
    Conn (Output "xor" 0) (Input "reg" 0),
    Conn (Output "reg" 0) (Input "xor" 1)]

inputs :: Array Input
inputs = [Input "xor" 0]

outputs :: Array Output
outputs = [Output "not" 0]


class Var a where
    var :: a -> String

instance varIn :: Var Input where
    var (Input bid num) = bid <> "In" <> show num

instance varOut :: Var Output where
    var (Output bid num) = bid <> "Out" <> show num


-- code generating functions

sepped :: Array String -> String -> String
sepped list sep = (foldl (\s x -> s <> x <> sep) "" (initlist)) <> lastStr
    where 
        initlist = maybe [] (\x -> x) (init list)
        lastStr = maybe "" (\x -> x) (last list)



gBundle :: forall a . Var a => Array a -> String
gBundle signals = case length signals of
    0 -> ""
    1 -> maybe "" var (signals !! 0)
    _ -> "(" <> sepped (map var signals) ", " <> ")"


gSystem :: Array Input -> Array Output -> String
gSystem ins outs = "system " <> inputsStr <> " = " <> outputsStr
    where
        inputsStr = gBundle ins
        outputsStr = gBundle outs


gWheres :: Array Block -> Array Connection -> Array String
gWheres blocks conns = map (gWhere conns) blocks

gWhere :: Array Connection -> Block -> String
gWhere conns (Blk id blockInputs blockOutputs) =  outputs <> " = " <> block <> " " <> inputs
    where
        outputs = gBundle outs
        block = id <> "B" <> bundle
        inputs = gBundle ins

        bundle = case length blockInputs of
            0 -> ""
            1 -> ""
            _ -> " $ bundle"

        -- array of Output signals
        outs = mapWithIndex (\i out -> (Output id i)) blockOutputs
        insInitial = mapWithIndex (\i out -> (Input id i)) blockInputs

        relevantConns = filter (\(Conn _ (Input bid num)) -> bid == id) conns

        ins = foldl substituteConnection insInitial relevantConns

        substituteConnection initial (Conn (Output bid num) (Input _ idx)) = 
            maybe [] (\x -> x) (updateAt idx (Output bid num) initial)


-- vergeet unbundle niet bij dingen met meerdere outputs