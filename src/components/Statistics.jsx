import React, { useState, useEffect, useRef } from 'react'
import { TrendingUp, Award, Star } from 'lucide-react'

const Statistics = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  const stats = [
    {
      icon: <TrendingUp size={40} strokeWidth={1.5} />,
      endValue: 50000,
      label: "Orders Processed",
      suffix: "+"
    },
    {
      icon: <Award size={40} strokeWidth={1.5} />,
      endValue: 125000,
      label: "Burritos Sold",
      suffix: "+"
    },
    {
      icon: <Star size={40} strokeWidth={1.5} />,
      endValue: 95000,
      label: "Tacos Sold",
      suffix: "+"
    }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

  return (
    <section className="statistics-section" ref={sectionRef}>
      <div className="container">
        <div className="stats-header">
          <h2 className="stats-title">Our Journey in Numbers</h2>
          <p className="stats-subtitle">
            Serving authentic flavors and building memories, one meal at a time
          </p>
        </div>

        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              endValue={stat.endValue}
              label={stat.label}
              suffix={stat.suffix}
              isVisible={isVisible}
              delay={index * 150}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

const StatCard = ({ icon, endValue, label, suffix, isVisible, delay }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const increment = endValue / steps
    let currentStep = 0

    const timer = setTimeout(() => {
      const counter = setInterval(() => {
        currentStep++
        if (currentStep <= steps) {
          setCount(Math.floor(increment * currentStep))
        } else {
          setCount(endValue)
          clearInterval(counter)
        }
      }, duration / steps)

      return () => clearInterval(counter)
    }, delay)

    return () => clearTimeout(timer)
  }, [isVisible, endValue, delay])

  const formatNumber = (num) => {
    return num.toLocaleString('en-US')
  }

  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-number">
        {formatNumber(count)}{suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default Statistics
