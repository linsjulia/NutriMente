package br.com.nutrimente.api.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositório = acesso ao banco. O Spring Data cria a implementação sozinho
 * a partir do NOME do método: findByEmail vira
 * "SELECT * FROM users WHERE email = ?".
 */
public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmail(String email);

	boolean existsByEmail(String email);

	/** CPF já cadastrado? A busca é pelo índice cego (o CPF em si está cifrado) */
	boolean existsByCpfHash(String cpfHash);
}
