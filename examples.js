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
mealy bram :: (Operand, MaybeAddrOperand) -> Operand`
}