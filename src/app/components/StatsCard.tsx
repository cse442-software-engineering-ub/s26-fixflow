import { motion } from 'motion/react';

interface StatsCardProps {
  title: string;
  count: number;
  color: 'red' | 'orange' | 'green' | 'blue';
}

export function StatsCard({ title, count, color }: StatsCardProps) {
  const colorConfig = {
    red: {
      text: 'text-black',
      bg: 'bg-red-300',
    },
    orange: {
      text: 'text-black',
      bg: 'bg-orange-300',
    },
    green: {
      text: 'text-black',
      bg: 'bg-green-300',
    },
    blue: {
      text: 'text-black',
      bg: 'bg-blue-300',
    },
  };

  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3 }}
      className={`${config.bg} rounded-lg p-4 flex flex-col`}
    >
      <h3 className="text-sm font-medium text-black mb-2">{title}</h3>
      <motion.p 
        className={`text-4xl font-bold ${config.text} leading-none`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
      >
        {count}
      </motion.p>
    </motion.div>
  );
}