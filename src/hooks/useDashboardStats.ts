import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, Checkin, Payment } from '../types';

export function useDashboardStats(tenantId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    checkinsToday: 0,
    monthlyRevenue: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    retentionRate: 0,
    recentCheckins: [] as any[],
    newStudents: [] as Student[],
    attendanceChart: [] as any[],
    revenueChart: [] as any[],
  });

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    let students: Student[] = [];
    let checkins: Checkin[] = [];
    let payments: Payment[] = [];

    const calculateStats = () => {
      const now = new Date();
      
      // Students
      const totalStudents = students.length;
      const activeStudents = students.filter(s => s.status === 'ACTIVE').length;
      const retentionRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 0;
      
      const newStudents = [...students]
        .filter(s => s.createdAt)
        .sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis())
        .slice(0, 3);

      // Check-ins
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const checkinsTodayCount = checkins.filter(c => c.checkinAt && c.checkinAt.toMillis() >= todayStart).length;
      
      const recentCheckins = [...checkins]
        .filter(c => c.checkinAt)
        .sort((a, b) => b.checkinAt?.toMillis() - a.checkinAt?.toMillis())
        .slice(0, 5)
        .map(c => {
          const student = students.find(s => s.id === c.studentId);
          return {
            ...c,
            studentName: student?.name || 'Aluno Desconhecido',
            status: student?.status || 'INACTIVE'
          };
        });

      // Attendance Chart (Last 7 days)
      const attendanceChart = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        
        const count = checkins.filter(c => {
          if (!c.checkinAt) return false;
          const time = c.checkinAt.toMillis();
          return time >= dayStart && time < dayEnd;
        }).length;
        
        const name = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
        attendanceChart.push({ name: name.replace('.', ''), checkins: count });
      }

      // Payments & Revenue
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyRevenue = payments
        .filter(p => {
          if (p.status !== 'PAID' || !p.paidAt) return false;
          const date = typeof p.paidAt.toDate === 'function' ? p.paidAt.toDate() : new Date(p.paidAt);
          return date >= monthStart;
        })
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

      const pendingAmount = payments
        .filter(p => p.status === 'PENDING')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

      const overdueAmount = payments
        .filter(p => p.status === 'OVERDUE')
        .reduce((acc, curr) => acc + (curr.amount || 0), 0);

      // Revenue Chart (Last 7 days)
      const revenueChart = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        
        const rev = payments
          .filter(p => p.status === 'PAID' && p.paidAt)
          .filter(p => {
            const date = typeof p.paidAt.toDate === 'function' ? p.paidAt.toDate() : new Date(p.paidAt);
            const time = date.getTime();
            return time >= dayStart && time < dayEnd;
          })
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        const name = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
        revenueChart.push({ name: name.replace('.', ''), revenue: rev });
      }

      setStats({
        totalStudents,
        checkinsToday: checkinsTodayCount,
        monthlyRevenue,
        pendingAmount,
        overdueAmount,
        retentionRate,
        recentCheckins,
        newStudents,
        attendanceChart,
        revenueChart
      });
      setLoading(false);
    };

    // Subscriptions
    const isMaster = tenantId === 'master-tenant';

    const unsubStudents = onSnapshot(
      isMaster 
        ? query(collection(db, 'students')) 
        : query(collection(db, 'students'), where('tenantId', '==', tenantId)),
      (snapshot) => {
        students = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student)).filter(s => !s.isDeleted);
        calculateStats();
      }, (error) => {
        console.error('Error in students subscription:', error);
        setLoading(false);
      }
    );

    const unsubCheckins = onSnapshot(
      isMaster 
        ? query(collection(db, 'checkins')) 
        : query(collection(db, 'checkins'), where('tenantId', '==', tenantId)),
      (snapshot) => {
        checkins = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Checkin));
        calculateStats();
      }, (error) => {
        console.error('Error in checkins subscription:', error);
        setLoading(false);
      }
    );

    const unsubPayments = onSnapshot(
      isMaster 
        ? query(collection(db, 'payments')) 
        : query(collection(db, 'payments'), where('tenantId', '==', tenantId)),
      (snapshot) => {
        payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment)).filter(p => !p.isDeleted);
        calculateStats();
      }, (error) => {
        console.error('Error in payments subscription:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubStudents();
      unsubCheckins();
      unsubPayments();
    };
  }, [tenantId]);

  return { stats, loading };
}
