'use client'

import { motion } from "framer-motion"

interface FadeScrollProps {
  children: React.ReactNode;
}

export default function FadeScrollProps({children} : FadeScrollProps){
    return(
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1 }}
        >
            {children}
        </motion.div>
    )
}