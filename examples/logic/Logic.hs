import Clash.Prelude


xor' :: () -> (Unsigned 1, Unsigned 1) -> ((), Unsigned 1)
xor' () (0, 0) = ((), 0)
xor' () (0, 1) = ((), 1)
xor' () (1, 0) = ((), 1)
xor' () (1, 1) = ((), 0)

xorB = mealy xor' ()

not' :: () -> (Unsigned 1) -> ((), Unsigned 1)
not' () 0 = ((), 1)
not' () 1 = ((), 0)

notB = mealy not' ()

reg' :: Unsigned 1 -> Unsigned 1 -> (Unsigned 1, Unsigned 1)
reg' state input = (state', state)
    where state' = input

regB = mealy reg' 0

-- generated by Click Clash:

system xorIn0 = notOut0
    where
        xorOut0 = xorB $ bundle (xorIn0, regOut0)
        regOut0 = regB xorOut0
        notOut0 = notB xorOut0

