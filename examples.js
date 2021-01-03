const examples = {
    'adder': 
`mealy reg :: (Unsigned 1) -> Unsigned 1
mealy clone :: (Unsigned 1) -> (Unsigned 1, Unsigned 1)
mealy add :: (Unsigned 1, Unsigned 1) -> (Unsigned 2)`,
    'logic':
`mealy xor :: (Unsigned 1, Unsigned 1) -> Unsigned 1
mealy and :: (Unsigned 1, Unsigned 1) -> Unsigned 1
mealy not :: (Unsigned 1) -> Unsigned 1
mealy reg :: (Unsigned 1) -> Unsigned 1`,
    'blockram':
`mealy control :: (Operand, Instr) -> (StackInstr, Output)
mealy stack :: StackInstr -> (Operand, MaybeAddrOperand)
mealy bram :: (Operand, MaybeAddrOperand) -> Operand`,
    'processor':
`mealy ifde :: (Instruction) -> (Instruction, PC, RegAddr)
mealy ex :: (Instruction, RegValue) -> (MaybePC, ExResult)
mealy mem :: (ExResult, RegValue) -> (RegValue, MemRead)
mealy wb :: (RegValue) -> (RegAddr, RegValue)

mealy pcmod :: (PC, MaybePC) -> PC

mealy regSel :: (RegAddr, RegAddr) -> RegAddr
mealy regfile :: (RegAddr, RegValue) -> RegValue

mealy memctrl :: (PC, MemRead) -> (Instruction, RegValue)

mealy output :: (RegValue) -> RegValue

mealy reg :: Instruction -> Instruction`
}