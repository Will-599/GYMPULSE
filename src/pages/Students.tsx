import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserPlus, Mail, Phone, ShieldCheck, ShieldAlert, Dumbbell, Pencil, Trash2, Building2, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useStudentStore } from '../store/studentStore';
import { useTenantStore } from '../store/tenantStore';
import { Student } from '../types';
import AddStudentModal from '../components/AddStudentModal';
import toast from 'react-hot-toast';

export default function Students() {
  const { tenant } = useAuthStore();
  const { plans, fetchPlans } = useWorkoutStore();
  const { students, loading, fetchStudents, fetchAllStudents, softDeleteStudent, updateStudent } = useStudentStore();
  const { tenants, fetchTenants } = useTenantStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const isMaster = tenant?.slug === 'master';

  useEffect(() => {
    if (!tenant) return;

    let unsubscribeStudents: () => void;
    if (isMaster) {
      unsubscribeStudents = fetchAllStudents();
    } else {
      unsubscribeStudents = fetchStudents(tenant.id);
    }
    
    const unsubscribePlans = fetchPlans(tenant.id);
    const unsubscribeTenants = fetchTenants();

    return () => {
      unsubscribeStudents();
      unsubscribePlans();
      unsubscribeTenants();
    };
  }, [tenant, isMaster, fetchStudents, fetchAllStudents, fetchPlans, fetchTenants]);

  const getTenantName = (tenantId: string) => {
    return tenants.find(t => t.id === tenantId)?.name || 'Academia';
  };

  const handleToggleAccess = async (student: Student) => {
    try {
      await updateStudent(student.id, { accessGranted: !student.accessGranted });
      toast.success(student.accessGranted ? 'Acesso revogado' : 'Acesso liberado!');
    } catch (error) {
      toast.error('Erro ao alterar acesso');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja excluir o aluno ${name}? Ele será movido para a lixeira.`)) {
      try {
        await softDeleteStudent(id);
        toast.success('Aluno movido para a lixeira');
      } catch (error) {
        toast.error('Erro ao excluir aluno');
      }
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Alunos</h1>
          <p className="text-brand-muted">Gerencie os alunos e seus planos de acesso</p>
        </div>
        {!isMaster && (
          <button 
            onClick={() => {
              setEditingStudent(null);
              setIsModalOpen(true);
            }} 
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={20} />
            Novo Aluno
          </button>
        )}
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou CPF..."
            className="input-field pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2 w-full md:w-auto">
          <Filter size={20} />
          Filtros
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black/50 border-b border-brand-border">
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Aluno</th>
                {isMaster && (
                  <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Academia</th>
                )}
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Plano</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Treino</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Acesso</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-brand-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={isMaster ? 7 : 6} className="px-6 py-8 text-center text-brand-muted">
                    Carregando alunos...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isMaster ? 7 : 6} className="px-6 py-8 text-center text-brand-muted">
                    {searchTerm ? 'Nenhum aluno encontrado para sua busca.' : 'Nenhum aluno cadastrado.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-brand-black/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-border flex items-center justify-center text-brand-muted">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-brand-text">{student.name}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-brand-muted">
                            <span className="flex items-center gap-1"><Mail size={12} />{student.email}</span>
                            <span className="flex items-center gap-1"><Phone size={12} />{student.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {isMaster && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-brand-muted">
                          <Building2 size={14} className="text-brand-green" />
                          <span className="text-xs font-medium">{getTenantName(student.tenantId)}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-sm text-brand-text capitalize">{student.planId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-brand-muted">
                        <Dumbbell size={14} className="text-brand-green" />
                        <span className="text-xs">Treino A</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {student.accessGranted ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-green">
                            <ShieldCheck size={14} />
                            Liberado
                          </span>
                          {student.accessId && (
                            <span className="text-[10px] font-mono text-brand-muted mt-0.5">ID: {student.accessId}</span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-muted">
                          <ShieldAlert size={14} />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!student.accessGranted && (
                          <button 
                            onClick={() => handleToggleAccess(student)}
                            className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Liberar Acesso"
                          >
                            <Key size={16} />
                            Ativar
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(student)}
                          className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-border rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {}}
        student={editingStudent}
      />
    </div>
  );
}
