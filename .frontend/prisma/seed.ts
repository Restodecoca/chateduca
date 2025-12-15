/**
 * Script para popular o banco de dados com dados iniciais
 * Execute com: npm run seed
 */
import PrismaClientPkg from '@prisma/client';
import bcrypt from 'bcrypt';

const { PrismaClient } = PrismaClientPkg;
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Limpar dados existentes (opcional - descomente se quiser limpar tudo)
  // await prisma.log.deleteMany();
  // await prisma.message.deleteMany();
  // await prisma.session.deleteMany();
  // await prisma.user.deleteMany();

  // Criar usuários de teste
  console.log('Criando usuários...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@chateduca.com' },
    update: {},
    create: {
      email: 'admin@chateduca.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'admin'
    }
  });

  const student = await prisma.user.upsert({
    where: { email: 'aluno@demo.com' },
    update: {
      name: 'João Silva',
      role: 'student'
    },
    create: {
      email: 'aluno@demo.com',
      name: 'João Silva',
      password: userPassword,
      role: 'student'
    }
  });

  const parent = await prisma.user.upsert({
    where: { email: 'responsavel@demo.com' },
    update: {
      name: 'Maria Santos',
      role: 'parent'
    },
    create: {
      email: 'responsavel@demo.com',
      name: 'Maria Santos',
      password: userPassword,
      role: 'parent'
    }
  });

  // Manter usuários legados para compatibilidade
  const user1 = await prisma.user.upsert({
    where: { email: 'usuario@chateduca.com' },
    update: {},
    create: {
      email: 'usuario@chateduca.com',
      name: 'Usuário Teste',
      password: userPassword,
      role: 'student'
    }
  });

  console.log('Usuários criados:');
  console.log(`   - ${admin.email} (${admin.role})`);
  console.log(`   - ${student.email} (${student.role})`);
  console.log(`   - ${parent.email} (${parent.role})`);
  console.log(`   - ${user1.email} (${user1.role})`);

  // Criar relação responsável-aluno
  console.log('Criando vínculo responsável-aluno...');
  
  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student.id
      }
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student.id
    }
  });

  console.log(`   - ${parent.name} vinculado a ${student.name}`);

  // Criar sessões de exemplo
  console.log('Criando sessões de exemplo...');
  
  const session1 = await prisma.session.upsert({
    where: { sessionId: 'session-demo-001' },
    update: {},
    create: {
      sessionId: 'session-demo-001',
      userId: student.id,
      metadata: {
        browser: 'Chrome',
        device: 'Desktop'
      }
    }
  });

  const session2 = await prisma.session.upsert({
    where: { sessionId: 'session-demo-002' },
    update: {},
    create: {
      sessionId: 'session-demo-002',
      userId: parent.id,
      metadata: {
        browser: 'Firefox',
        device: 'Mobile'
      }
    }
  });

  console.log(`${2} sessões criadas`);

  // Criar mensagens de exemplo
  console.log('Criando mensagens de exemplo...');

  await prisma.message.createMany({
    data: [
      {
        sessionId: session1.sessionId,
        userId: student.id,
        role: 'user',
        content: 'Olá! Como funciona o sistema de RAG?'
      },
      {
        sessionId: session1.sessionId,
        userId: student.id,
        role: 'assistant',
        content: 'O sistema RAG (Retrieval-Augmented Generation) combina busca de informações com geração de texto. Ele busca documentos relevantes e usa essas informações para gerar respostas contextualizadas.',
        sources: ['doc1.pdf', 'doc2.pdf']
      },
      {
        sessionId: session1.sessionId,
        userId: student.id,
        role: 'user',
        content: 'Quais são os boletins disponíveis?'
      },
      {
        sessionId: session2.sessionId,
        userId: parent.id,
        role: 'user',
        content: 'Preciso de informações sobre educação.'
      },
      {
        sessionId: session2.sessionId,
        userId: parent.id,
        role: 'assistant',
        content: 'Encontrei várias informações sobre educação nos boletins. Posso ajudá-la com algum tópico específico?',
        sources: ['boletim_educacao.pdf']
      }
    ]
  });

  console.log('Mensagens de exemplo criadas');

  // Criar alguns logs de exemplo
  console.log('Criando logs de exemplo...');

  await prisma.log.createMany({
    data: [
      {
        level: 'info',
        message: 'Sistema iniciado com sucesso',
        requestId: 'req-001'
      },
      {
        level: 'info',
        message: 'Usuário realizou login',
        userId: student.id,
        requestId: 'req-002',
        metadata: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0'
        }
      },
      {
        level: 'warn',
        message: 'Tentativa de acesso a recurso restrito',
        userId: student.id,
        requestId: 'req-003'
      },
      {
        level: 'error',
        message: 'Erro ao processar requisição',
        requestId: 'req-004',
        metadata: {
          error: 'Connection timeout'
        }
      }
    ]
  });

  console.log('Logs de exemplo criados');

  // Estatísticas finais
  const stats = {
    users: await prisma.user.count(),
    sessions: await prisma.session.count(),
    messages: await prisma.message.count(),
    logs: await prisma.log.count()
  };

  console.log('\nEstatísticas do banco de dados:');
  console.log(`   - Usuários: ${stats.users}`);
  console.log(`   - Sessões: ${stats.sessions}`);
  console.log(`   - Mensagens: ${stats.messages}`);
  console.log(`   - Logs: ${stats.logs}`);

  console.log('\nSeed concluído com sucesso!');
  console.log('\n=== Credenciais de Teste ===');
  console.log('Admin:        admin@chateduca.com / admin123');
  console.log('Aluno:        aluno@demo.com / user123');
  console.log('Responsável:  responsavel@demo.com / user123');
  console.log('User legado:  usuario@chateduca.com / user123');
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
