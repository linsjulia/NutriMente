"use client";

import { motion } from "framer-motion"

interface FadeInProps{
    children: React.ReactNode
}

export default function FadeIn({children} : FadeInProps){
    return(
        <motion.div
            initial={{ opacity: 0, y: 50}}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-xl bg-white p-6"
        >
            {children}
        </motion.div>
    )
}