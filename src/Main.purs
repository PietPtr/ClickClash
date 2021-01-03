module Main where

import Prelude

import Effect (Effect)
import Effect.Console (log)

import Control.Alt ((<|>))
import Data.Either (Either)
import Data.Array (length, (!!), init, last, filter, mapWithIndex, updateAt, concat, elem, foldl) 
import Data.List (toUnfoldable, many, (:), some, List(..), intercalate) 
import Data.Maybe (maybe)
import Data.String.CodeUnits (fromCharArray)
import Text.Parsing.Parser (ParseError, Parser, runParser)
import Text.Parsing.Parser.Combinators (sepBy, sepBy1, sepEndBy, try)
import Text.Parsing.Parser.String (char, oneOf, string)
import Text.Parsing.Parser.Language (haskellDef)
import Text.Parsing.Parser.Token (TokenParser, alphaNum, makeTokenParser)

{-
Toevoegingen:

- speciaal bram block omdat ie een spannend type heeft?
- specifieke unbundle blokjes voor subtuples (requires veel betere parsing)
- toevoegen van kopieren van blokken, gaat spannend worden met de namen (dan moet er iets onderligged 
    zijn wat blockId en de onderliggende mealy functie onderscheid)
- inputs nicer maken, nu kan je het hacken door ze als blokjes toe te voegen maar dat moet eigenlijk 
    gespecificeerd worden door de gebruiker op een nette manier. Vooral moet het mogelijk zijn om dezelfde
    input naar meerdere blokken te sturen.
- support voor pure functies (die zijn helemaal lastig voor users gezien <$> en <*>), kan wel mooi als 
    `pure func :: a -> b` getypt worden
- support voor type variables (haha)

- zo veel random bugs in de javascript...

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


-- haskell code generation


type Type = String
type BlockId = String
type SigIdx = Int

data Block = Blk String (Array Type) (Array Type) -- inputs outputs

instance showBlock :: Show Block where
    show (Blk id i o) = "Blk " <> show id <> " " <> show i <> " " <> show o

data Connection = Conn Signal Signal -- Output Input

instance showConnection :: Show Connection where
    show (Conn o i) = "Conn " <> show o <> " " <> show i


data Signal = Signal BlockId SigIdx Direction
data Direction = In | Out

derive instance eqDir :: Eq Direction
derive instance eqSignal :: Eq Signal


instance showSignal :: Show Signal where
    show (Signal bid sigidx dir) = "Signal " <> show dir <> " " <> show bid <> " " <> show sigidx


instance showDirection :: Show Direction where
    show In = "In"
    show Out = "Out"

blocksExample :: Array Block
blocksExample = [
    Blk "xor" ["Unsigned 1", "Unsigned 1"] ["Unsigned 1"], 
    Blk "reg" ["Unsigned 1"] ["Unsigned 1"],
    Blk "not" ["Unsigned 1"] ["Unsigned 1"]]

connsExample :: Array Connection
connsExample = [
    Conn (Signal "reg" 0 Out) (Signal "xor" 1 In)]


-- code generating functions

var :: Signal -> String
var (Signal bid idx dir) = bid <> show dir <> show idx

sepped :: Array String -> String -> String
sepped list sep = (foldl (\s x -> s <> x <> sep) "" (initlist)) <> lastStr
    where 
        initlist = maybe [] (\x -> x) (init list)
        lastStr = maybe "" (\x -> x) (last list)



gBundle :: Array Signal -> String
gBundle signals = case length signals of
    0 -> ""
    1 -> maybe "" var (signals !! 0)
    _ -> "(" <> sepped (map var signals) ", " <> ")"


gSystem :: Array Signal -> Array Signal -> String
gSystem ins outs = "system " <> inputsStr <> " = " <> outBundle <> outputsStr
    where
        inputsStr = case length ins of
            0 -> ""
            1 -> maybe "" var (ins !! 0)
            _ -> "inputs"
        outputsStr = gBundle outs

        outBundle = if length ins < 2 
            then ""
            else "bundle "



gWheres :: Array Block -> Array Connection -> Array String
gWheres blocks conns = map (gWhere conns) blocks

gWhere :: Array Connection -> Block -> String
gWhere conns (Blk id blockInputs blockOutputs) =  outputs <> " = " <> block <> " " <> inputs
    where
        outputs = gBundle outs
        block = unbundle <> id <> "B" <> bundle
        inputs = gBundle ins

        bundle = case length blockInputs of
            0 -> ""
            1 -> ""
            _ -> " $ bundle"

        unbundle = case length blockOutputs of
            0 -> ""
            1 -> ""
            _ -> "unbundle $ "


        outs = mapWithIndex (\i out -> (Signal id i Out)) blockOutputs
        insInitial = mapWithIndex (\i out -> (Signal id i In)) blockInputs

        relevantConns = filter (\(Conn _ (Signal bid _ _)) -> bid == id) conns

        ins = foldl substituteConnection insInitial relevantConns

        substituteConnection initial (Conn (Signal bid num Out) (Signal _ idx In)) = 
            maybe [] (\x -> x) (updateAt idx (Signal bid num Out) initial)
        substituteConnection initial _ = initial -- aaaah gooi aub iets van een exception of zo hier


gInputUnbundleLine :: Array Signal -> String
gInputUnbundleLine ins = gBundle ins <> " = unbundle inputs"


gAll :: Array Block -> Array Connection -> String
gAll blocks conns = sepped ([defLine, whereLine] <> wheresLines' <> [inputUnbundleLine]) "\n"
    where
        defLine = gSystem ins outs
        whereLine = "    where"
        wheresLines = gWheres blocks conns
        wheresLines' = map (\a -> "        " <> a) wheresLines
        inputUnbundleLine = case length ins of 
            0 -> ""
            1 -> ""
            _ -> "        " <> gInputUnbundleLine ins

        ins = unconnectedSignals conns blocks In
        outs = unconnectedSignals conns blocks Out


unconnectedSignals :: Array Connection -> Array Block -> Direction -> Array Signal
unconnectedSignals conns blocks dir = filter (\s -> not $ s `elem` usedCheck) allCheck
    where
        allOutputs = concat $ map 
            (\(Blk bid _ out) -> mapWithIndex (\i _ -> Signal bid i Out) out) blocks

        allInputs = concat $ map 
            (\(Blk bid inp _) -> mapWithIndex (\i _ -> Signal bid i In) inp) blocks

        allCheck = case dir of
            In -> allInputs
            Out -> allOutputs

        usedInputs = map (\(Conn _ inp) -> inp) conns
        usedOutputs = map (\(Conn out _) -> out) conns

        usedCheck = case dir of
            In -> usedInputs
            Out -> usedOutputs

        